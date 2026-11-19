import { appendFile } from "node:fs/promises";
import process from "node:process";
import { pathToFileURL } from "node:url";

type Repository = { id: number; full_name: string };
type Pull = { number: number; state?: string; head: { sha: string; repo: Repository }; base?: { repo: Repository } };
type Run = { id: number; run_attempt: number; name: string; path: string; event: string; status: string; conclusion: string; workflow_id: number; head_sha: string; repository: Repository; head_repository: Repository; pull_requests: Pull[] };
type Artifact = { id: number; name: string; expired: boolean; digest: string; workflow_run: { id: number; repository_id: number; head_sha: string } };
type Job = { name: string; status: string; conclusion: string };
type Deployment = { id: number; payload: unknown };
export type Identity = { runId: string; runAttempt: string; prNumber: number; headSha: string; headRepository: string; artifactId: number; artifactDigest: string; reportId: number; reportDigest: string };
export type Settings = { token: string; apiUrl: string; repository: string; repositoryId: string; runId: string; runAttempt: string; expected?: string };

export async function eligibility(settings: Settings, fetcher: typeof fetch = fetch): Promise<{ eligible: boolean; identity: Identity }> {
  const { token, apiUrl, repository, repositoryId, runId, runAttempt } = settings;
  if (!/^[\w.-]+\/[\w.-]+$/u.test(repository) || ![repositoryId, runId, runAttempt].every(v => /^[1-9]\d*$/u.test(v)))
    throw new Error("Invalid repository or run identity.");
  const root = `${apiUrl.replace(/\/$/u, "")}/repos/${repository}`;
  async function get<T>(route: string): Promise<T> {
    const response = await fetcher(`${root}${route}`, {
      headers: { "authorization": `Bearer ${token}`, "accept": "application/vnd.github+json", "x-github-api-version": "2022-11-28" },
    });
    if (!response.ok)
      throw new Error(`GitHub API request failed (${response.status}): ${route}`);
    return await response.json() as T;
  }
  async function pages<T>(route: string, key?: string): Promise<T[]> {
    const all: T[] = [];
    for (let page = 1; ; page++) {
      const result = await get<T[] | Record<string, T[]>>(`${route}${route.includes("?")
        ? "&"
        : "?"}per_page=100&page=${page}`);
      const items = Array.isArray(result)
        ? result
        : result[key!];
      if (!Array.isArray(items))
        throw new TypeError("Invalid paginated GitHub response.");
      all.push(...items);
      if (items.length < 100)
        return all;
    }
  }
  const [run, current, workflow] = await Promise.all([
    get<Run>(`/actions/runs/${runId}/attempts/${runAttempt}`),
    get<Run>(`/actions/runs/${runId}`),
    get<{ id: number }>("/actions/workflows/ci.yml"),
  ]);
  if (String(run.id) !== runId || String(run.run_attempt) !== runAttempt || String(run.repository.id) !== repositoryId || run.repository.full_name.toLowerCase() !== repository.toLowerCase() || run.name !== "CI" || run.path !== ".github/workflows/ci.yml" || run.workflow_id !== workflow.id || run.event !== "pull_request" || run.status !== "completed" || run.conclusion !== "success" || !/^[a-f0-9]{40}$/u.test(run.head_sha))
    throw new Error("Source run is not the successful CI pull request attempt.");
  if (String(current.id) !== runId || String(current.run_attempt) !== runAttempt
    || String(current.repository.id) !== repositoryId || current.repository.full_name.toLowerCase() !== repository.toLowerCase()
    || current.name !== "CI" || current.path !== ".github/workflows/ci.yml" || current.workflow_id !== workflow.id
    || current.event !== "pull_request" || current.status !== "completed" || current.conclusion !== "success"
    || current.head_sha !== run.head_sha || current.head_repository?.id !== run.head_repository?.id) {
    throw new Error("The latest CI run attempt is different or no longer successful.");
  }
  const jobs = await pages<Job>(`/actions/runs/${runId}/attempts/${runAttempt}/jobs`, "jobs");
  for (const name of [
    "Lint",
    "Unit tests",
    "Build, types and package",
    "Browser tests (website)",
    "Browser tests (comparison)",
    "Dependency review",
    "CI / Required",
  ]) {
    const matches = jobs.filter(job => job.name === name);
    if (matches.length !== 1 || matches[0].status !== "completed" || matches[0].conclusion !== "success")
      throw new Error(`Required CI job failed or missing: ${name}`);
  }
  const associations = run.pull_requests?.length
    ? run.pull_requests
    : await pages<Pull>(`/commits/${run.head_sha}/pulls`);
  const candidates = associations.filter(pr => pr.head?.sha === run.head_sha && pr.head.repo?.id === run.head_repository?.id);
  if (candidates.length !== 1 || !Number.isSafeInteger(candidates[0].number) || candidates[0].number < 1)
    throw new Error("Cannot uniquely associate the run with a pull request head.");
  const pr = await get<Pull>(`/pulls/${candidates[0].number}`);
  if (pr.number !== candidates[0].number || pr.state !== "open" || pr.head.sha !== run.head_sha || pr.head.repo?.id !== run.head_repository.id || pr.head.repo.full_name.toLowerCase() !== run.head_repository.full_name.toLowerCase() || String(pr.base?.repo.id) !== repositoryId)
    throw new Error("Pull request is closed or its head has changed.");
  const artifacts = await pages<Artifact>(`/actions/runs/${runId}/artifacts`, "artifacts");
  function artifact(name: string): Artifact {
    const matches = artifacts.filter(item => item.name === name);
    if (matches.length !== 1)
      throw new Error(`Missing or ambiguous artifact: ${name}`);
    const item = matches[0];
    if (item.expired || !Number.isSafeInteger(item.id) || item.id < 1 || !/^sha256:[a-f0-9]{64}$/u.test(item.digest) || String(item.workflow_run?.id) !== runId || String(item.workflow_run?.repository_id) !== repositoryId || item.workflow_run?.head_sha !== run.head_sha)
      throw new Error(`Invalid artifact identity: ${name}`);
    return item;
  }
  const build = artifact("browser-builds");
  const report = artifact("browser-results-comparison");
  const identity: Identity = {
    runId,
    runAttempt,
    prNumber: pr.number,
    headSha: pr.head.sha,
    headRepository: pr.head.repo.full_name,
    artifactId: build.id,
    artifactDigest: build.digest,
    reportId: report.id,
    reportDigest: report.digest,
  };
  if (settings.expected && JSON.stringify(identity) !== JSON.stringify(JSON.parse(settings.expected)))
    throw new Error("Source identity changed after approval.");
  const deployments = await pages<Deployment>(`/deployments?environment=comparison-preview-pr-${pr.number}`);
  for (const deployment of deployments) {
    let payload = deployment.payload;
    if (typeof payload === "string") {
      try {
        payload = JSON.parse(payload);
      }
      catch {
        continue;
      }
    }
    if (!payload || typeof payload !== "object")
      continue;
    const values = payload as Record<string, unknown>;
    if (String(values.runId) !== runId || String(values.runAttempt) !== runAttempt || values.artifactDigest !== build.digest)
      continue;
    const statuses = await pages<{ state: string }>(`/deployments/${deployment.id}/statuses`);
    if (statuses[0]?.state === "success")
      return { eligible: false, identity };
  }
  return { eligible: true, identity };
}

async function main(): Promise<void> {
  function required(name: string): string {
    const value = process.env[name];
    if (!value)
      throw new Error(`${name} is required.`);
    return value;
  }
  const expected = process.argv.includes("--expect")
    ? required("EXPECTED_IDENTITY")
    : undefined;
  const result = await eligibility({
    token: required("GH_TOKEN"),
    apiUrl: required("GITHUB_API_URL"),
    repository: required("GITHUB_REPOSITORY"),
    repositoryId: required("GITHUB_REPOSITORY_ID"),
    runId: required("SOURCE_RUN_ID"),
    runAttempt: required("SOURCE_RUN_ATTEMPT"),
    ...(expected
      ? { expected }
      : {}),
  });
  const i = result.identity;
  const outputs = {
    eligible: String(result.eligible),
    pr: String(i.prNumber),
    head_sha: i.headSha,
    artifact_id: String(i.artifactId),
    artifact_digest: i.artifactDigest,
    report_id: String(i.reportId),
    identity: JSON.stringify(i),
  };
  if (process.env.GITHUB_OUTPUT)
    await appendFile(process.env.GITHUB_OUTPUT, Object.entries(outputs).map(([key, value]) => `${key}=${value}\n`).join(""));
  if (process.env.GITHUB_STEP_SUMMARY)
    await appendFile(process.env.GITHUB_STEP_SUMMARY, `## Comparison preview eligibility\n\n- PR: https://github.com/${process.env.GITHUB_REPOSITORY}/pull/${i.prNumber}\n- Run: https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${i.runId}/attempts/${i.runAttempt}\n- Head: \`${i.headSha}\`\n- Build: \`${i.artifactId}\` / \`${i.artifactDigest}\`\n- Report: \`${i.reportId}\`\n- Eligible: ${result.eligible}\n`);
  console.log(JSON.stringify(result));
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error
      ? error.message
      : error);
    process.exitCode = 1;
  });
}
