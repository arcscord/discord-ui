import { Buffer } from "node:buffer";
import { execFileSync } from "node:child_process";
import { appendFile, readdir, readFile } from "node:fs/promises";
import { resolve } from "node:path";
import process from "node:process";
import { eligibility } from "./eligibility.mts";

for (const name of [
  "CLOUDFLARE_API_TOKEN",
  "CLOUDFLARE_ACCOUNT_ID",
  "CLOUDFLARE_PAGES_PROJECT",
  "WRANGLER_BIN",
]) {
  if (!process.env[name])
    throw new Error(`${name} is required.`);
}
if (!/^[a-f\d]{32}$/u.test(process.env.CLOUDFLARE_ACCOUNT_ID!)
  || !/^[a-z0-9][a-z0-9-]{0,57}$/u.test(process.env.CLOUDFLARE_PAGES_PROJECT!)) {
  throw new Error("Invalid Cloudflare account or project configuration.");
}

const identity = JSON.parse(process.env.EXPECTED_IDENTITY!);
const root = resolve(process.env.RUNNER_TEMP!, `preview-${process.env.GITHUB_RUN_ID}-${process.env.GITHUB_RUN_ATTEMPT}`);
const metadata = JSON.parse(await readFile(`${root}/metadata.json`, "utf8"));
const repository = process.env.GITHUB_REPOSITORY!;
async function github(route: string, body: unknown): Promise<any> {
  const response = await fetch(`${process.env.GITHUB_API_URL}/repos/${repository}${route}`, {
    method: "POST",
    headers: { "authorization": `Bearer ${process.env.GH_TOKEN}`, "accept": "application/vnd.github+json", "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!response.ok)
    throw new Error(`GitHub deployment update failed (${response.status}).`);
  return response.json();
}
const settings = {
  token: process.env.GH_TOKEN!,
  apiUrl: process.env.GITHUB_API_URL!,
  repository,
  repositoryId: process.env.GITHUB_REPOSITORY_ID!,
  runId: identity.runId,
  runAttempt: identity.runAttempt,
  expected: process.env.EXPECTED_IDENTITY!,
};
if (!(await eligibility(settings)).eligible)
  throw new Error("Revision has already been deployed.");
const deployment = await github("/deployments", {
  ref: identity.headSha,
  environment: `comparison-preview-pr-${identity.prNumber}`,
  auto_merge: false,
  required_contexts: [],
  transient_environment: true,
  production_environment: false,
  description: "Reviewed native framework comparison",
  payload: metadata,
});
async function status(state: string, url?: string): Promise<void> {
  await github(`/deployments/${deployment.id}/statuses`, {
    state,
    auto_inactive: false,
    log_url: `https://github.com/${repository}/actions/runs/${process.env.GITHUB_RUN_ID}`,
    ...(url
      ? { environment_url: url }
      : {}),
  });
}
try {
  await status("in_progress");
  const output = `${root}/wrangler.jsonl`;
  // A clean working directory prevents repository configuration discovery.
  execFileSync(process.env.WRANGLER_BIN!, [
    "pages",
    "deploy",
    `${root}/site`,
    "--project-name",
    process.env.CLOUDFLARE_PAGES_PROJECT!,
    "--branch",
    `pr-${identity.prNumber}`,
    "--commit-hash",
    metadata.testedCheckoutSha,
    "--commit-dirty=false",
  ], {
    cwd: root,
    stdio: "inherit",
    env: { ...process.env, WRANGLER_OUTPUT_FILE_PATH: output },
  });
  const records = (await readFile(output, "utf8")).trim().split("\n").map(line => JSON.parse(line));
  const result = records.reverse().find(record => record.type === "pages-deploy-detailed");
  const project = process.env.CLOUDFLARE_PAGES_PROJECT!;
  const immutable = new URL(result?.url);
  const alias = new URL(result?.alias);
  if (immutable.protocol !== "https:" || !new RegExp(`^[a-z0-9]+\\.${project}\\.pages\\.dev$`, "u").test(immutable.hostname)
    || alias.href !== `https://pr-${identity.prNumber}.${project}.pages.dev/`
    || result.environment !== "preview" || result.deployment_trigger?.metadata?.commit_hash !== metadata.testedCheckoutSha) {
    throw new Error("Cloudflare deployment identity mismatch.");
  }
  const checkedPaths = [
    "",
    "previews/react/index.html",
    "previews/vue/index.html",
    "previews/svelte/index.html",
    "report.html",
    "preview-metadata.json",
  ];
  for (const [directory, extension] of [
    ["assets", ".js"],
    ["assets", ".css"],
    ["fonts", ".woff2"],
    ["generated/avatars", ".svg"],
  ]) {
    const entries = await readdir(`${root}/site/${directory}`);
    const sample = entries.sort().find(name => name.endsWith(extension));
    if (!sample)
      throw new Error(`Required preview asset missing in ${directory}.`);
    checkedPaths.push(`${directory}/${sample}`);
  }
  for (const path of checkedPaths) {
    const response = await fetch(new URL(path, immutable), {
      redirect: "error",
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok || !response.headers.get("x-robots-tag")?.includes("noindex"))
      throw new Error(`Preview smoke check failed for ${path}.`);
    const expected = await readFile(`${root}/site/${path || "index.html"}`);
    const actual = Buffer.from(await response.arrayBuffer());
    if (!actual.equals(expected))
      throw new Error(`Published content mismatch for ${path}.`);
  }
  // Check closure or a new head during the provider request before recording success.
  await eligibility(settings);
  await status("success", immutable.href);
  await appendFile(process.env.GITHUB_OUTPUT!, `url=${immutable.href}\nalias=${alias.href}\n`);
  await appendFile(process.env.GITHUB_STEP_SUMMARY!, `## Published comparison preview\n\n[Revision preview](${immutable.href}) · [PR alias](${alias.href}) · [Evidence](${new URL("report.html", immutable).href})\n\nHead \`${identity.headSha}\`\n\nTested checkout \`${metadata.testedCheckoutSha}\`\n`);
}
catch (error) {
  await status("failure");
  throw error;
}
