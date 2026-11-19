import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import process from "node:process";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let root: string;
const testedCheckoutSha = "b".repeat(40);
const createArchive = `
import json
import sys
import zipfile
archive, files = sys.argv[1:]
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as output:
    for path, contents in json.loads(files).items():
        output.writestr(path, contents)
`;

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "preview-publish-test-"));
});
afterEach(async () => {
  await rm(root, { recursive: true, force: true });
});

async function archive(name: string, files: Record<string, string>): Promise<string> {
  const path = join(root, name);
  execFileSync("python3", [
    "-c",
    createArchive,
    path,
    JSON.stringify(files),
  ]);
  return `sha256:${createHash("sha256").update(await readFile(path)).digest("hex")}`;
}

async function prepare(mode: "valid" | "association" | "digest"): Promise<{ run: () => void; site: string; identity: Record<string, string | number> }> {
  const identity = {
    runId: "123",
    runAttempt: "2",
    headSha: "a".repeat(40),
    prNumber: 42,
    headRepository: "contributor/fork",
    artifactId: "100",
    artifactDigest: "",
    reportId: "101",
    reportDigest: "",
  };
  const buildMetadata = {
    schemaVersion: 1,
    repository: "owner/repository",
    repositoryId: "456",
    workflow: "CI",
    event: "pull_request",
    runId: 123,
    runAttempt: 2,
    sourcePullRequest: { headSha: identity.headSha, number: 42, repository: "contributor/fork" },
    testedCheckoutSha,
    eventSha: testedCheckoutSha,
  };
  const buildFiles: Record<string, string> = {
    ".local/browser-build/metadata.json": JSON.stringify(buildMetadata),
    "apps/comparison/dist/index.html": "<!doctype html><title>Comparison</title>",
    "apps/comparison/dist/assets/app.js": "export default 1",
  };
  for (const framework of ["react", "vue", "svelte"])
    buildFiles[`apps/comparison/dist/previews/${framework}/index.html`] = `<!doctype html><title>${framework}</title>`;
  identity.artifactDigest = await archive("build.zip", buildFiles);
  const report = {
    status: "passed",
    execution: { runId: "123", runAttempt: "2" },
    buildArtifact: {
      id: mode === "association"
        ? "999"
        : "100",
      digest: identity.artifactDigest,
    },
    build: { testedCheckoutSha },
    tests: [
      { title: "framework comparison", status: "passed" },
    ],
    errors: [],
  };
  identity.reportDigest = await archive("report.zip", {
    "comparison-docker/browser-report-manifest.json": JSON.stringify(report),
  });
  if (mode === "digest")
    identity.artifactDigest = `sha256:${"0".repeat(64)}`;

  const bootstrap = join(root, "fetch.mjs");
  await writeFile(bootstrap, `
import { readFile } from "node:fs/promises";
globalThis.fetch = async (url) => {
  const id = String(url).match(/\\/artifacts\\/(100|101)\\/zip$/)?.[1];
  if (!id) throw new Error("Unexpected artifact URL " + url);
  return new Response(await readFile(${JSON.stringify(root)} + (id === "100" ? "/build.zip" : "/report.zip")));
};
`);
  const runner = join(root, "runner");
  await mkdir(runner);
  return {
    identity,
    site: join(runner, "preview-777-1/site"),
    run: () => {
      execFileSync(process.execPath, [
        "--import",
        bootstrap,
        resolve("scripts/preview/publish.mts"),
      ], {
        stdio: "pipe",
        env: {
          ...process.env,
          EXPECTED_IDENTITY: JSON.stringify(identity),
          RUNNER_TEMP: runner,
          GITHUB_RUN_ID: "777",
          GITHUB_RUN_ATTEMPT: "1",
          GITHUB_REPOSITORY: "owner/repository",
          GITHUB_REPOSITORY_ID: "456",
          GITHUB_API_URL: "https://api.github.test",
          GH_TOKEN: "test-fixture-token",
          GITHUB_OUTPUT: join(root, "output"),
        },
      });
    },
  };
}

describe("trusted preview preparation process", () => {
  it("downloads real artifact archives and publishes static assets with linked CI evidence", async () => {
    const prepared = await prepare("valid");
    prepared.run();
    expect(await readFile(join(prepared.site, "index.html"), "utf8")).toContain("Comparison");
    expect(await readFile(join(prepared.site, "previews/vue/index.html"), "utf8")).toContain("vue");
    const headers = await readFile(join(prepared.site, "_headers"), "utf8");
    expect(headers).toContain("X-Robots-Tag: noindex, nofollow");
    expect(headers).toContain("X-Content-Type-Options: nosniff");
    const metadata = JSON.parse(await readFile(join(prepared.site, "preview-metadata.json"), "utf8"));
    expect(metadata).toEqual({
      ...prepared.identity,
      testedCheckoutSha,
      testCount: 1,
      ciUrl: "https://github.com/owner/repository/actions/runs/123/attempts/2",
    });
    expect(JSON.parse(await readFile(join(prepared.site, "../metadata.json"), "utf8"))).toEqual(metadata);
    expect(await readFile(join(prepared.site, "report.html"), "utf8")).toContain("preview-metadata.json");
    expect(await readFile(join(root, "output"), "utf8")).toBe(`site=${prepared.site}\ntested_sha=${testedCheckoutSha}\n`);
  });

  it("rejects a report associated with another build before publishing", async () => {
    const prepared = await prepare("association");
    expect(prepared.run).toThrow("not associated with the approved successful build");
    await expect(readFile(join(prepared.site, "index.html"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(root, "output"))).rejects.toMatchObject({ code: "ENOENT" });
  });

  it("rejects an archive with the wrong digest before publishing", async () => {
    const prepared = await prepare("digest");
    expect(prepared.run).toThrow("digest mismatch");
    await expect(readFile(join(prepared.site, "index.html"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(root, "output"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
