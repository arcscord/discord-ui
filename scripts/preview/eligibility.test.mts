import { describe, expect, it } from "vitest";
import { eligibility } from "./eligibility.mts";

const sha = "a".repeat(40);
const digest = `sha256:${"b".repeat(64)}`;
const base = { id: 1, full_name: "owner/repo" };
const fork = { id: 2, full_name: "fork/repo" };
const settings = {
  token: "token",
  apiUrl: "https://api.github.com",
  repository: "owner/repo",
  repositoryId: "1",
  runId: "10",
  runAttempt: "1",
};
function fixture() {
  const pull = {
    number: 7,
    state: "open",
    head: { sha, repo: fork },
    base: { repo: base },
  };
  const run = {
    id: 10,
    run_attempt: 1,
    name: "CI",
    path: ".github/workflows/ci.yml",
    event: "pull_request",
    status: "completed",
    conclusion: "success",
    workflow_id: 5,
    head_sha: sha,
    repository: base,
    head_repository: fork,
    pull_requests: [],
  };
  const current = { ...run };
  const jobs = [
    "Lint",
    "Unit tests",
    "Build, types and package",
    "Browser tests (website)",
    "Browser tests (comparison)",
    "Dependency review",
    "CI / Required",
  ].map(name => ({ name, status: "completed", conclusion: "success" }));
  const artifacts = ["browser-builds", "browser-results-comparison"].map((name, index) => ({
    id: index + 11,
    name,
    expired: false,
    digest,
    workflow_run: { id: 10, repository_id: 1, head_sha: sha },
  }));
  const commitPulls = [pull];
  const openPulls = [pull];
  const fetcher: typeof fetch = async (input) => {
    const path = new URL(String(input)).pathname.replace("/repos/owner/repo", "");
    let body: unknown;
    if (path === "/actions/runs/10/attempts/1") {
      body = run;
    }
    else if (path === "/actions/runs/10") {
      body = current;
    }
    else if (path === "/actions/workflows/ci.yml") {
      body = { id: 5 };
    }
    else if (path.endsWith("/jobs")) {
      body = { jobs };
    }
    else if (path === `/commits/${sha}/pulls`) {
      body = commitPulls;
    }
    else if (path === "/pulls") {
      expect(new URL(String(input)).searchParams.get("state")).toBe("open");
      body = openPulls;
    }
    else if (path === "/pulls/7") {
      body = pull;
    }
    else if (path.endsWith("/artifacts")) {
      body = { artifacts };
    }
    else if (path === "/deployments") {
      body = [];
    }
    else {
      throw new Error(`Unexpected request ${path}`);
    }
    return new Response(JSON.stringify(body), { status: 200 });
  };
  return {
    run,
    current,
    pull,
    jobs,
    artifacts,
    commitPulls,
    openPulls,
    fetcher,
  };
}

describe("preview eligibility", () => {
  it("accepts a verified fork via the commit association fallback", async () => {
    const f = fixture();
    const result = await eligibility(settings, f.fetcher);
    expect(result.eligible).toBe(true);
    expect(result.identity).toMatchObject({
      prNumber: 7,
      headSha: sha,
      headRepository: "fork/repo",
      artifactId: 11,
      reportId: 12,
    });
  });
  it("rejects a stale pull request", async () => {
    const f = fixture();
    f.pull.head.sha = "c".repeat(40);
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow();
  });
  it("accepts a verified fork when GitHub returns no PR associations", async () => {
    const f = fixture();
    f.commitPulls.length = 0;
    const result = await eligibility(settings, f.fetcher);
    expect(result.eligible).toBe(true);
    expect(result.identity).toMatchObject({ prNumber: 7, headSha: sha, headRepository: fork.full_name });
  });
  it("rejects ambiguous open pull requests", async () => {
    const f = fixture();
    f.commitPulls.length = 0;
    f.openPulls.push({ ...f.pull, number: 8 });
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow("Cannot uniquely associate");
  });
  it("rejects an open pull request from another fork with the same SHA", async () => {
    const f = fixture();
    f.commitPulls.length = 0;
    f.pull.head.repo = { id: 3, full_name: "other/repo" };
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow("Cannot uniquely associate");
  });
  it("rejects a stale open pull request when associations are empty", async () => {
    const f = fixture();
    f.commitPulls.length = 0;
    f.pull.head.sha = "c".repeat(40);
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow("Cannot uniquely associate");
  });
  it("rejects failed required checks and a different workflow", async () => {
    const f = fixture();
    f.jobs.at(-1)!.conclusion = "failure";
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow("Required CI job");
    f.jobs.at(-1)!.conclusion = "success";
    f.run.workflow_id = 8;
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow("Source run");
  });
  it("rejects expired artifacts and invalid digests", async () => {
    const f = fixture();
    f.artifacts[0].expired = true;
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow("Invalid artifact");
    f.artifacts[0].expired = false;
    f.artifacts[0].digest = "sha256:bad";
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow("Invalid artifact");
  });
  it("rejects a newer attempt, whether running or failed", async () => {
    const f = fixture();
    f.current.run_attempt = 2;
    f.current.status = "in_progress";
    f.current.conclusion = "";
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow("latest CI run attempt");
    f.current.status = "completed";
    f.current.conclusion = "failure";
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow("latest CI run attempt");
  });
  it("rejects inconsistent latest run identity", async () => {
    const f = fixture();
    f.current.workflow_id = 8;
    await expect(eligibility(settings, f.fetcher)).rejects.toThrow("latest CI run attempt");
  });
  it("rejects an identity changed after approval", async () => {
    const f = fixture();
    const { identity } = await eligibility(settings, f.fetcher);
    await expect(eligibility({
      ...settings,
      expected: JSON.stringify({ ...identity, runAttempt: "2" }),
    }, f.fetcher)).rejects.toThrow("changed after approval");
  });
});
