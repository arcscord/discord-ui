import type { FullConfig, FullResult, Suite, TestCase, TestResult } from "@playwright/test/reporter";
import { Buffer } from "node:buffer";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import CiReporter from "./ci-reporter.mts";

function planned(id: string): TestCase {
  return {
    id,
    titlePath: () => ["differential", id],
    parent: {
      project: () => ({ name: "differential" }),
    },
    location: { file: "/workspace/tests/comparison/differential.spec.ts", line: 1, column: 1 },
    expectedStatus: "passed",
  } as unknown as TestCase;
}
function attempt(status: TestResult["status"], retry = 0): TestResult {
  return {
    retry,
    status,
    duration: 42,
    errors: [],
    attachments: [],
  } as unknown as TestResult;
}
function finish(status: FullResult["status"]): FullResult {
  return {
    status,
    duration: 100,
    startTime: new Date("2026-11-19T10:00:00Z"),
  };
}

describe("browser CI report manifest", () => {
  let directory: string;
  let output: string;
  beforeEach(() => {
    directory = mkdtempSync(join(tmpdir(), "discord-ui-ci-report-"));
    output = join(directory, "manifest.json");
    vi.stubEnv("GITHUB_RUN_ID", "");
    vi.stubEnv("GITHUB_RUN_ATTEMPT", "");
    vi.stubEnv("BROWSER_REPORT_MANIFEST", output);
    vi.stubEnv("BROWSER_BUILD_METADATA", "");
    vi.stubEnv("BROWSER_BUILD_ARTIFACT_ID", "");
    vi.stubEnv("BROWSER_BUILD_ARTIFACT_DIGEST", "");
    vi.stubEnv("GITHUB_RUN_ID", "");
    vi.stubEnv("GITHUB_RUN_ATTEMPT", "");
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    rmSync(directory, { recursive: true, force: true });
  });
  function begin(tests: TestCase[]): CiReporter {
    const reporter = new CiReporter();
    reporter.onBegin({ rootDir: "/workspace" } as FullConfig, {
      allTests: () => tests,
    } as Suite);
    return reporter;
  }
  function read(): Record<string, any> {
    return JSON.parse(readFileSync(output, "utf8")) as Record<string, any>;
  }

  it("retains failing, interrupted and unstarted planned tests", () => {
    const failed = planned("failed");
    const interrupted = planned("interrupted");
    const reporter = begin([
      failed,
      interrupted,
      planned("unstarted"),
    ]);
    const failure = attempt("failed");
    failure.errors.push({ message: "Expected callback mismatch" });
    reporter.onTestEnd(failed, failure);
    reporter.onTestEnd(interrupted, attempt("interrupted"));
    reporter.onError({ message: "Worker stopped" });
    expect(reporter.onEnd(finish("interrupted"))).toBeUndefined();
    const manifest = read();
    expect(manifest.status).toBe("interrupted");
    expect(manifest.errors).toEqual([
      { message: "Worker stopped" },
    ]);
    expect(manifest.tests.map((test: any) => test.attempts.map((value: any) => value.status)))
      .toEqual([
        ["failed"],
        ["interrupted"],
        [],
      ]);
    expect(manifest.tests[0].attempts[0].errors[0].message).toBe("Expected callback mismatch");
    expect(manifest.tests[0].location.file).toBe("tests/comparison/differential.spec.ts");
    expect(manifest.build).toBeNull();
  });

  it("retains retries, evidence, relative attachments and explicit skipped attempts", () => {
    const test = planned("classic ash 390");
    const skipped = planned("skipped");
    const reporter = begin([test, skipped]);
    reporter.onTestEnd(test, attempt("failed"));
    const passed = attempt("passed", 1);
    const evidence = {
      matrix: { scenario: "classic", theme: "ash", width: 390 },
      result: { visual: "identical" },
    };
    const evidencePath = join(directory, "comparison-evidence.json");
    writeFileSync(evidencePath, JSON.stringify(evidence));
    passed.attachments.push({ name: "comparison-evidence", contentType: "application/json", path: evidencePath });
    reporter.onTestEnd(test, passed);
    reporter.onTestEnd(skipped, attempt("skipped"));
    reporter.onEnd(finish("passed"));
    const manifest = read();
    expect(manifest.tests[0].attempts.map((value: any) => value.retry)).toEqual([0, 1]);
    expect(manifest.tests[0].attempts[1]).toMatchObject({ durationMs: 42, comparison: evidence });
    expect(manifest.tests[0].attempts[1].attachments[0].path).toBe("comparison-evidence.json");
    expect(manifest.tests[1].attempts[0].status).toBe("skipped");
  });

  it("preserves the source PR head independently of the tested merge commit", () => {
    const build = {
      sourcePullRequest: { number: 42, headSha: "contributor-head" },
      testedCheckoutSha: "merge-commit",
      runId: "123",
      attempt: "2",
    };
    const metadataPath = join(directory, "build.json");
    writeFileSync(metadataPath, JSON.stringify(build));
    vi.stubEnv("GITHUB_RUN_ID", "123");
    vi.stubEnv("BROWSER_BUILD_METADATA", metadataPath);
    vi.stubEnv("GITHUB_RUN_ATTEMPT", "3");
    vi.stubEnv("BROWSER_BUILD_ARTIFACT_ID", "456");
    vi.stubEnv("BROWSER_BUILD_ARTIFACT_DIGEST", "sha256:artifact");
    begin([]).onEnd(finish("passed"));
    expect(read().build).toEqual(build);
    expect(read().execution).toEqual({ runId: "123", runAttempt: "3" });
    expect(read().buildArtifact).toEqual({ id: "456", digest: "sha256:artifact" });
  });

  it("permits a local container with CI enabled and no GitHub run", () => {
    vi.stubEnv("CI", "true");
    begin([]).onEnd(finish("passed"));
    expect(read().build).toBeNull();
  });

  it("requires readable metadata in a GitHub Actions run", () => {
    vi.stubEnv("GITHUB_RUN_ID", "123");
    expect(() => begin([])).toThrow("BROWSER_BUILD_METADATA");
    vi.stubEnv("BROWSER_BUILD_METADATA", join(directory, "missing.json"));
    expect(() => begin([])).toThrow();
  });

  it("keeps malformed evidence visible without changing the test result", () => {
    const test = planned("malformed");
    const reporter = begin([test]);
    const result = attempt("failed");
    result.attachments.push({
      name: "comparison-evidence",
      contentType: "application/json",
      body: Buffer.from("broken"),
    });
    reporter.onTestEnd(test, result);
    reporter.onEnd(finish("failed"));
    expect(read().tests[0].attempts[0]).toMatchObject({ status: "failed", comparison: null });
    expect(read().tests[0].attempts[0].evidenceError).toContain("SyntaxError");
  });
});
