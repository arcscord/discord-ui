import { execFileSync, spawn } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import { expect, it } from "vitest";

it("associates PR head, tested merge checkout and artifact while accepting failed-job reruns", async () => {
  const directory = await mkdtemp(join(tmpdir(), "browser-build-metadata-"));
  const metadataPath = join(directory, "metadata.json");
  const eventPath = join(directory, "event.json");
  const sha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
  const digest = "a".repeat(64);
  let artifactRunId = 42;
  const server = createServer((request, response) => {
    response.setHeader("content-type", "application/json");
    response.end(JSON.stringify(request.url?.includes("/artifacts/")
      ? {
          id: 9,
          name: "browser-builds",
          expired: false,
          digest: `sha256:${digest}`,
          workflow_run: { id: artifactRunId, repository_id: 7, head_sha: "head" },
        }
      : {
          id: 42,
          repository: { id: 7 },
          event: "pull_request",
          name: "CI",
          head_sha: "head",
        }));
  });
  await new Promise<void>(resolve => server.listen(0, "127.0.0.1", resolve));
  const address = server.address() as { port: number };
  const env = {
    ...process.env,
    BROWSER_BUILD_METADATA: metadataPath,
    GITHUB_EVENT_PATH: eventPath,
    GITHUB_REPOSITORY: "arcscord/discord-ui",
    GITHUB_REPOSITORY_ID: "7",
    GITHUB_RUN_ID: "42",
    GITHUB_RUN_ATTEMPT: "1",
    GITHUB_WORKFLOW: "CI",
    GITHUB_EVENT_NAME: "pull_request",
    GITHUB_SHA: sha,
    GITHUB_API_URL: `http://127.0.0.1:${address.port}`,
    GH_TOKEN: "fixture",
    BROWSER_BUILD_ARTIFACT_ID: "9",
    BROWSER_BUILD_ARTIFACT_DIGEST: digest,
  };
  async function run(verify = false): Promise<number | null> {
    return new Promise((resolve, reject) => {
      const child = spawn(process.execPath, [
        "scripts/comparison/build-metadata.mts",
        ...verify
          ? ["--verify"]
          : [],
      ], {
        env,
        cwd: process.cwd(),
        stdio: "ignore",
      });
      child.once("error", reject);
      child.once("exit", resolve);
    });
  }
  try {
    await writeFile(eventPath, JSON.stringify({
      number: 12,
      pull_request: {
        head: {
          sha: "contributor-head",
          repo: { full_name: "contributor/discord-ui" },
        },
      },
    }));
    expect(await run()).toBe(0);
    const metadata = JSON.parse(await readFile(metadataPath, "utf8"));
    expect(metadata.testedCheckoutSha).toBe(sha);
    expect(metadata.sourcePullRequest.headSha).toBe("contributor-head");
    expect(await run(true)).toBe(0);
    env.GITHUB_RUN_ATTEMPT = "2";
    expect(await run(true)).toBe(0);
    artifactRunId = 43;
    expect(await run(true)).toBe(1);
    artifactRunId = 42;
    env.BROWSER_BUILD_ARTIFACT_DIGEST = "b".repeat(64);
    expect(await run(true)).toBe(1);
    env.BROWSER_BUILD_ARTIFACT_DIGEST = digest;
    await writeFile(metadataPath, JSON.stringify({ ...metadata, testedCheckoutSha: "stale" }));
    expect(await run(true)).toBe(1);
  }
  finally {
    server.close();
    await rm(directory, { recursive: true, force: true });
  }
}, 20_000);
