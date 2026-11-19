import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import process from "node:process";

const path = process.env.BROWSER_BUILD_METADATA!;
if (!path)
  throw new Error("BROWSER_BUILD_METADATA is required.");

function required(name: string): string {
  const value = process.env[name];
  if (!value)
    throw new Error(`${name} is required.`);
  return value;
}

const repository = required("GITHUB_REPOSITORY");
const runId = required("GITHUB_RUN_ID");
const runAttempt = required("GITHUB_RUN_ATTEMPT");
const testedCheckoutSha = execFileSync("git", ["rev-parse", "HEAD"], { encoding: "utf8" }).trim();
const event = JSON.parse(await readFile(required("GITHUB_EVENT_PATH"), "utf8"));
const expected = {
  schemaVersion: 1,
  repository,
  repositoryId: required("GITHUB_REPOSITORY_ID"),
  workflow: required("GITHUB_WORKFLOW"),
  event: required("GITHUB_EVENT_NAME"),
  runId,
  runAttempt,
  eventSha: required("GITHUB_SHA"),
  testedCheckoutSha,
  sourcePullRequest: event.pull_request
    ? { number: event.number, headSha: event.pull_request.head.sha, repository: event.pull_request.head.repo.full_name }
    : null,
};

if (process.argv.includes("--verify")) {
  const metadata = JSON.parse(await readFile(path, "utf8"));
  if (!Number.isInteger(Number(metadata.runAttempt)) || Number(metadata.runAttempt) < 1
    || Number(metadata.runAttempt) > Number(runAttempt)
    || JSON.stringify({ ...metadata, runAttempt }) !== JSON.stringify(expected)) {
    throw new Error("Downloaded build metadata does not match this checkout and run attempt.");
  }
  async function api<T>(route: string): Promise<T> {
    const response = await fetch(`${required("GITHUB_API_URL")}/repos/${repository}/actions/${route}`, {
      headers: { authorization: `Bearer ${required("GH_TOKEN")}`, accept: "application/vnd.github+json" },
    });
    if (!response.ok)
      throw new Error(`GitHub metadata lookup failed (${response.status}).`);
    return await response.json() as T;
  }
  const [run, artifact] = await Promise.all([
    api<{ id: number; repository: { id: number }; event: string; name: string; head_sha: string }>(`runs/${runId}`),
    api<{ id: number; name: string; expired: boolean; digest: string; workflow_run: { id: number; repository_id: number; head_sha: string } }>(`artifacts/${required("BROWSER_BUILD_ARTIFACT_ID")}`),
  ]);
  const digest = required("BROWSER_BUILD_ARTIFACT_DIGEST").replace(/^sha256:/u, "");
  if (String(run.id) !== runId || String(run.repository.id) !== expected.repositoryId
    || run.event !== expected.event || run.name !== expected.workflow
    || String(artifact.id) !== required("BROWSER_BUILD_ARTIFACT_ID") || artifact.name !== "browser-builds" || artifact.expired
    || String(artifact.workflow_run.id) !== runId
    || String(artifact.workflow_run.repository_id) !== expected.repositoryId
    || artifact.workflow_run.head_sha !== run.head_sha
    || artifact.digest !== `sha256:${digest}`) {
    throw new Error("GitHub run/artifact identity or digest mismatch.");
  }
}
else {
  await mkdir(dirname(path), { recursive: true });
  await writeFile(path, `${JSON.stringify(expected, null, 2)}\n`);
}
