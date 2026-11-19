import type { FullConfig, FullResult, Reporter, Suite, TestCase, TestError, TestResult } from "@playwright/test/reporter";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import process from "node:process";

type Attempt = {
  retry: number;
  status: TestResult["status"];
  durationMs: number;
  errors: TestError[];
  attachments: { name: string; contentType: string; path: string | null }[];
  comparison: unknown;
  evidenceError: string | null;
};
type PlannedTest = {
  id: string;
  title: string[];
  project: string | null;
  location: { file: string; line: number; column: number };
  expectedStatus: TestCase["expectedStatus"];
  attempts: Attempt[];
};

/** Keep a machine-readable record even when a journey fails before its first checkpoint. */
export default class CiReporter implements Reporter {
  private rootDir = process.cwd();
  private outputPath = "";
  private buildMetadata: unknown = null;
  private tests = new Map<string, PlannedTest>();
  private errors: TestError[] = [];

  onBegin(config: FullConfig, suite: Suite): void {
    this.rootDir = config.rootDir;
    this.outputPath = resolve(process.env.BROWSER_REPORT_MANIFEST ?? ".local/browser-report-manifest.json");
    const metadataPath = process.env.BROWSER_BUILD_METADATA;
    if (process.env.GITHUB_RUN_ID && !metadataPath)
      throw new Error("BROWSER_BUILD_METADATA is required for browser reports in CI.");
    if (metadataPath)
      this.buildMetadata = JSON.parse(readFileSync(metadataPath, "utf8")) as unknown;
    for (const test of suite.allTests()) {
      this.tests.set(test.id, {
        id: test.id,
        title: test.titlePath(),
        project: test.parent.project()?.name ?? null,
        location: {
          ...test.location,
          file: relative(this.rootDir, test.location.file),
        },
        expectedStatus: test.expectedStatus,
        attempts: [],
      });
    }
  }

  onTestEnd(test: TestCase, result: TestResult): void {
    const evidence = result.attachments.find(attachment => attachment.name === "comparison-evidence");
    let comparison: unknown = null;
    let evidenceError: string | null = null;
    if (evidence) {
      try {
        const source = evidence.path
          ? readFileSync(evidence.path, "utf8")
          : evidence.body?.toString("utf8");
        if (!source)
          throw new Error("Comparison evidence has no content.");
        comparison = JSON.parse(source) as unknown;
      }
      catch (error) {
        evidenceError = String(error);
      }
    }
    this.tests.get(test.id)!.attempts.push({
      retry: result.retry,
      status: result.status,
      durationMs: result.duration,
      errors: result.errors,
      attachments: result.attachments.map(attachment => ({
        name: attachment.name,
        contentType: attachment.contentType,
        path: attachment.path
          ? relative(dirname(this.outputPath), attachment.path)
          : null,
      })),
      comparison,
      evidenceError,
    });
  }

  onError(error: TestError): void {
    this.errors.push(error);
  }

  onEnd(result: FullResult): void {
    mkdirSync(dirname(this.outputPath), { recursive: true });
    writeFileSync(this.outputPath, `${JSON.stringify({
      schemaVersion: 1,
      build: this.buildMetadata,
      execution: {
        runId: process.env.GITHUB_RUN_ID ?? null,
        runAttempt: process.env.GITHUB_RUN_ATTEMPT ?? null,
      },
      buildArtifact: {
        id: process.env.BROWSER_BUILD_ARTIFACT_ID ?? null,
        digest: process.env.BROWSER_BUILD_ARTIFACT_DIGEST ?? null,
      },
      status: result.status,
      durationMs: result.duration,
      startedAt: result.startTime.toISOString(),
      errors: this.errors,
      tests: [
        ...this.tests.values(),
      ],
    }, null, 2)}\n`);
  }
}
