import { execFileSync } from "node:child_process";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { verifyBuild } from "./artifact.mts";

const headSha = "a".repeat(40);
const testedCheckoutSha = "b".repeat(40);
const identity = {
  runId: "123",
  runAttempt: "2",
  headSha,
  prNumber: 42,
  headRepository: "contributor/fork",
};
let root: string;

function metadata() {
  return {
    schemaVersion: 1,
    repository: "owner/repository",
    repositoryId: "456",
    workflow: "CI",
    event: "pull_request",
    runId: 123,
    runAttempt: 2,
    sourcePullRequest: { headSha, number: 42, repository: "contributor/fork" },
    testedCheckoutSha,
    eventSha: testedCheckoutSha,
  };
}

beforeEach(async () => {
  root = await mkdtemp(join(tmpdir(), "preview-artifact-test-"));
  vi.stubEnv("GITHUB_REPOSITORY", "owner/repository");
  vi.stubEnv("GITHUB_REPOSITORY_ID", "456");
});
afterEach(async () => {
  vi.unstubAllEnvs();
  await rm(root, { recursive: true, force: true });
});

async function writeMetadata(value: unknown): Promise<void> {
  const directory = join(root, ".local/browser-build");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "metadata.json"), JSON.stringify(value));
}

describe("verified browser build metadata", () => {
  it("returns the actual tested checkout SHA for matching CI metadata", async () => {
    await writeMetadata(metadata());
    await expect(verifyBuild(root, identity)).resolves.toBe(testedCheckoutSha);
  });

  it("accepts a retained artifact from an earlier attempt of the approved run", async () => {
    await writeMetadata({
      ...metadata(),
      runAttempt: 1,
    });
    await expect(verifyBuild(root, identity)).resolves.toBe(testedCheckoutSha);
  });

  it.each([
    ["schemaVersion", 2],
    ["repository", "other/repository"],
    ["repositoryId", "789"],
    ["workflow", "Other workflow"],
    ["event", "push"],
    ["runId", 124],
    ["runAttempt", 0],
    ["runAttempt", 3],
    ["testedCheckoutSha", "invalid"],
    [
      "eventSha",
      "c".repeat(40),
    ],
  ])("rejects mismatched %s metadata %s", async (field, value) => {
    await writeMetadata({
      ...metadata(),
      [field]: value,
    });
    await expect(verifyBuild(root, identity)).rejects.toThrow("does not match");
  });

  it.each([
    [
      "headSha",
      "c".repeat(40),
    ],
    ["number", 43],
    ["repository", "other/fork"],
  ])("rejects mismatched pull request %s", async (field, value) => {
    const valueMetadata = metadata();
    await writeMetadata({
      ...valueMetadata,
      sourcePullRequest: { ...valueMetadata.sourcePullRequest, [field]: value },
    });
    await expect(verifyBuild(root, identity)).rejects.toThrow("does not match");
  });

  it("rejects missing source pull request metadata", async () => {
    await writeMetadata({
      ...metadata(),
      sourcePullRequest: null,
    });
    await expect(verifyBuild(root, identity)).rejects.toThrow("does not match");
  });
});

const createArchive = `
import stat
import sys
import zipfile
kind, archive = sys.argv[1:]
with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as output:
    output.writestr("index.html", "<html>fixture</html>")
    if kind == "valid":
        output.writestr("assets/app.js", "export default 1")
    elif kind == "symlink":
        entry = zipfile.ZipInfo("linked")
        entry.create_system = 3
        entry.external_attr = (stat.S_IFLNK | 0o777) << 16
        output.writestr(entry, "../outside")
    elif kind == "oversized":
        with output.open("large.js", "w") as entry:
            block = b"0" * 1024**2
            for _ in range(201):
                entry.write(block)
    else:
        output.writestr(kind, "escaped")
`;

describe("artifact ZIP extraction boundary", () => {
  function extract(kind: string): string {
    const archive = join(root, "artifact.zip");
    const destination = join(root, "extracted");
    execFileSync("python3", ["-c", createArchive, kind, archive]);
    execFileSync("python3", [
      resolve("scripts/preview/extract.py"),
      archive,
      destination,
    ], { stdio: "pipe" });
    return destination;
  }

  it("extracts ordinary static resources", async () => {
    const destination = extract("valid");
    expect(await readFile(join(destination, "index.html"), "utf8")).toBe("<html>fixture</html>");
    expect(await readFile(join(destination, "assets/app.js"), "utf8")).toBe("export default 1");
  });

  it.each([
    "../outside",
    "assets/../../outside",
    "/absolute",
    "assets\\outside",
    "C:outside",
    "symlink",
    "oversized",
  ])("rejects archive entry %s before extraction", async (kind) => {
    expect(() => extract(kind)).toThrow();
    await expect(readFile(join(root, "extracted/index.html"))).rejects.toMatchObject({ code: "ENOENT" });
    await expect(readFile(join(root, "outside"))).rejects.toMatchObject({ code: "ENOENT" });
  });
});
