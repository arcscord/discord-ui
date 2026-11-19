import { spawnSync } from "node:child_process";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { afterEach, describe, expect, it } from "vitest";

const sha = "a".repeat(40);
const tested = "c".repeat(40);
const digest = `sha256:${"b".repeat(64)}`;
const identity = {
  runId: "10",
  runAttempt: "1",
  prNumber: 7,
  headSha: sha,
  headRepository: "fork/repo",
  artifactId: 11,
  artifactDigest: digest,
  reportId: 12,
  reportDigest: digest,
};
const metadata = { ...identity, testedCheckoutSha: tested, testCount: 5 };
const directories: string[] = [];
afterEach(() => {
  for (const dir of directories.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

function invoke(stale = false, mismatch = false) {
  const dir = mkdtempSync(join(tmpdir(), "preview-upload-test-"));
  directories.push(dir);
  const root = join(dir, "preview-99-1");
  mkdirSync(join(root, "site"), { recursive: true });
  writeFileSync(join(root, "metadata.json"), JSON.stringify(metadata));
  for (const path of [
    "index.html",
    "previews/react/index.html",
    "previews/vue/index.html",
    "previews/svelte/index.html",
    "report.html",
    "assets/app.js",
    "assets/app.css",
    "fonts/font.woff2",
    "generated/avatars/user.svg",
    "preview-metadata.json",
  ]) {
    const file = join(root, "site", path);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, path === "preview-metadata.json"
      ? JSON.stringify(metadata)
      : "ok");
  }
  const output = join(dir, "output");
  const summary = join(dir, "summary");
  const log = join(dir, "requests.jsonl");
  const wrangler = join(dir, "wrangler");
  writeFileSync(wrangler, `#!/bin/sh\nprintf '%s\\n' '{"type":"pages-deploy-detailed","url":"https://abcd.project.pages.dev/","alias":"https://pr-7.project.pages.dev/","environment":"preview","deployment_trigger":{"metadata":{"commit_hash":"${tested}"}}}' > "$WRANGLER_OUTPUT_FILE_PATH"\nprintf '%s\\n' "$@" > "$TEST_WRANGLER_ARGS"\n`, { mode: 0o755 });
  const bootstrap = join(dir, "bootstrap.mjs");
  writeFileSync(bootstrap, `
import { appendFileSync } from 'node:fs';
const sha = ${JSON.stringify(sha)};
const digest = ${JSON.stringify(digest)};
const base = { id: 1, full_name: 'owner/repo' };
const fork = { id: 2, full_name: 'fork/repo' };
let pullChecks = 0;
globalThis.fetch = async (input, options = {}) => {
  const url = new URL(String(input));
  appendFileSync(process.env.TEST_LOG, JSON.stringify({ url: url.href, method: options.method || 'GET', redirect: options.redirect, body: options.body ? JSON.parse(options.body) : null }) + '\\n');
  if (url.hostname === 'abcd.project.pages.dev') {
    if (url.pathname.endsWith('.html')) throw new TypeError('fetch failed: unexpected redirect');
    return new Response(url.pathname === '/preview-metadata.json' ? JSON.stringify(${JSON.stringify(metadata)}) : (${mismatch} && url.pathname === '/report' ? 'wrong' : 'ok'), { headers: { 'x-robots-tag': 'noindex, nofollow' } });
  }
  const path = url.pathname.replace('/repos/owner/repo', '');
  const pull = { number: 7, state: 'open', head: { sha, repo: fork }, base: { repo: base } };
  let data;
  if (path === '/actions/runs/10/attempts/1' || path === '/actions/runs/10') data = { id: 10, run_attempt: 1, name: 'CI', path: '.github/workflows/ci.yml', event: 'pull_request', status: 'completed', conclusion: 'success', workflow_id: 5, head_sha: sha, repository: base, head_repository: fork, pull_requests: [pull] };
  else if (path === '/actions/workflows/ci.yml') data = { id: 5 };
  else if (path.endsWith('/jobs')) data = { jobs: ['Lint', 'Unit tests', 'Build, types and package', 'Browser tests (website)', 'Browser tests (comparison)', 'Dependency review', 'CI / Required'].map(name => ({ name, status: 'completed', conclusion: 'success' })) };
  else if (path === '/pulls/7') { pullChecks++; data = { ...pull, state: ${stale} && pullChecks > 1 ? 'closed' : 'open' }; }
  else if (path.endsWith('/artifacts')) data = { artifacts: ['browser-builds', 'browser-results-comparison'].map((name, index) => ({ id: index + 11, name, expired: false, digest, workflow_run: { id: 10, repository_id: 1, head_sha: sha } })) };
  else if (path === '/deployments' && options.method === 'POST') data = { id: 42 };
  else if (path === '/deployments') data = [];
  else if (path === '/deployments/42/statuses' && options.method === 'POST') data = {};
  else throw new Error('Unexpected request: ' + url.href);
  return new Response(JSON.stringify(data), { status: 200 });
};
`);
  const result = spawnSync(process.execPath, [
    "--import",
    bootstrap,
    resolve("scripts/preview/upload.mts"),
  ], {
    encoding: "utf8",
    env: {
      ...process.env,
      EXPECTED_IDENTITY: JSON.stringify(identity),
      RUNNER_TEMP: dir,
      GITHUB_RUN_ID: "99",
      GITHUB_RUN_ATTEMPT: "1",
      GITHUB_REPOSITORY: "owner/repo",
      GITHUB_REPOSITORY_ID: "1",
      GITHUB_API_URL: "https://api.github.test",
      GH_TOKEN: "test-token",
      WRANGLER_BIN: wrangler,
      CLOUDFLARE_PAGES_PROJECT: "project",
      CLOUDFLARE_ACCOUNT_ID: "d".repeat(32),
      CLOUDFLARE_API_TOKEN: "test-token",
      GITHUB_OUTPUT: output,
      GITHUB_STEP_SUMMARY: summary,
      TEST_LOG: log,
      TEST_WRANGLER_ARGS: join(dir, "args"),
    },
  });
  if (result.status !== 0 && !existsSync(log))
    throw new Error(result.stderr);
  const requests = readFileSync(log, "utf8").trim().split("\n").map(line => JSON.parse(line));
  return {
    result,
    requests,
    root,
    output,
    summary,
    args: readFileSync(join(dir, "args"), "utf8"),
  };
}

describe("preview upload", () => {
  it("publishes the reviewed build, verifies smoke routes, and records successful deployment", () => {
    const { result, requests, root, output, summary, args } = invoke();
    expect(result.stderr).toBe("");
    expect(result.status).toBe(0);
    const posts = requests.filter((request: { method: string }) => request.method === "POST");
    expect(posts[0].body).toMatchObject({
      ref: sha,
      environment: "comparison-preview-pr-7",
      payload: metadata,
      auto_merge: false,
    });
    expect(posts.slice(1).map((request: { body: { state: string } }) => request.body.state)).toEqual(["in_progress", "success"]);
    expect(posts[2].body.environment_url).toBe("https://abcd.project.pages.dev/");
    expect(args).toContain(`${root}/site\n--project-name\nproject\n--branch\npr-7\n--commit-hash\n${tested}`);
    const smokeRequests = requests.filter((request: { url: string }) => request.url.startsWith("https://abcd.project.pages.dev/"));
    expect(smokeRequests.map((request: { url: string }) => new URL(request.url).pathname)).toEqual([
      "/",
      "/previews/react/",
      "/previews/vue/",
      "/previews/svelte/",
      "/report",
      "/preview-metadata.json",
      "/assets/app.js",
      "/assets/app.css",
      "/fonts/font.woff2",
      "/generated/avatars/user.svg",
    ]);
    expect(smokeRequests.every((request: { redirect: string }) => request.redirect === "error")).toBe(true);
    expect(readFileSync(output, "utf8")).toContain("url=https://abcd.project.pages.dev/");
    expect(readFileSync(summary, "utf8")).toContain(tested);
  });
  it("rejects a published response with different bytes", () => {
    const { result, requests } = invoke(false, true);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("Published content mismatch for report.html");
    const states = requests.filter((request: { method: string; url: string }) => request.method === "POST" && request.url.endsWith("/statuses")).map((request: { body: { state: string } }) => request.body.state);
    expect(states).toEqual(["in_progress", "failure"]);
  });
  it("records failure if the pull request closes while deployment is running", () => {
    const { result, requests } = invoke(true);
    expect(result.status).not.toBe(0);
    expect(result.stderr).toContain("closed or its head has changed");
    const states = requests.filter((request: { method: string; url: string }) => request.method === "POST" && request.url.endsWith("/statuses")).map((request: { body: { state: string } }) => request.body.state);
    expect(states).toEqual(["in_progress", "failure"]);
  });
});
