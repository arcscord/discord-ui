import type { CommentSettings } from "./pr-comment.mts";
import { describe, expect, it } from "vitest";
import { updatePreviewComment } from "./pr-comment.mts";

const sha = "a".repeat(40);
const tested = "b".repeat(40);
const oldSha = "c".repeat(40);
const oldTested = "d".repeat(40);
const marker = "<!-- discord-ui-comparison-preview -->";
const settings: CommentSettings = {
  token: "token",
  apiUrl: "https://api.github.test",
  repository: "owner/repo",
  repositoryId: "1",
  publisherRunId: "20",
  publisherRunAttempt: "3",
  identity: {
    runId: "10",
    runAttempt: "1",
    prNumber: 7,
    headSha: sha,
    headRepository: "fork/repo",
    artifactId: 11,
    artifactDigest: `sha256:${"e".repeat(64)}`,
    reportId: 12,
    reportDigest: `sha256:${"f".repeat(64)}`,
  },
  testedCheckoutSha: tested,
  phase: "pending",
};
type Comment = { id: number; body: string; user: { login: string; type: string } };
type Deployment = { id: number; creator: { login: string }; payload: { headSha: string; testedCheckoutSha: string } };
function fixture() {
  const pr = {
    state: "open",
    head: { sha },
    base: {
      repo: { id: 1 },
    },
  };
  const run = { run_attempt: 1 };
  const comments: Comment[] = [];
  const deployments: Deployment[] = [];
  const statuses: Record<number, { state: string; environment_url?: string }[]> = {};
  const writes: { method: string; path: string; body: string }[] = [];
  let revisionChecks = 0;
  let changeBeforeWrite = false;
  const fetcher: typeof fetch = async (input, options) => {
    const url = new URL(String(input));
    const path = url.pathname.replace("/repos/owner/repo", "");
    const method = options?.method ?? "GET";
    let body: unknown;
    if (method === "POST" || method === "PATCH") {
      writes.push({ method, path, body: JSON.parse(String(options?.body)).body });
      body = {};
    }
    else if (path === "/pulls/7") {
      revisionChecks++;
      body = changeBeforeWrite && revisionChecks > 1
        ? { ...pr, state: "closed" }
        : pr;
    }
    else if (path === "/actions/runs/10") {
      body = run;
    }
    else if (path === "/deployments") {
      body = deployments.slice((Number(url.searchParams.get("page")) - 1) * 100, Number(url.searchParams.get("page")) * 100);
    }
    else if (path === "/deployments/42/statuses") {
      body = statuses[42] ?? [];
    }
    else if (path === "/deployments/43/statuses") {
      body = statuses[43] ?? [];
    }
    else if (path === "/issues/7/comments") {
      body = comments.slice((Number(url.searchParams.get("page")) - 1) * 100, Number(url.searchParams.get("page")) * 100);
    }
    else {
      throw new Error(`Unexpected request ${method} ${url.href}`);
    }
    return new Response(JSON.stringify(body), { status: 200 });
  };
  function publish(headSha = sha, testedCheckoutSha = tested, url = "https://abcd.project.pages.dev/") {
    deployments.push({
      id: 42,
      creator: { login: "github-actions[bot]" },
      payload: { headSha, testedCheckoutSha },
    });
    statuses[42] = [
      { state: "success", environment_url: url },
    ];
  }
  return {
    pr,
    run,
    comments,
    deployments,
    statuses,
    writes,
    fetcher,
    publish,
    changeBeforeWrite: () => { changeBeforeWrite = true; },
  };
}

describe("preview PR comments", () => {
  it("posts pending approval with the exact publisher attempt and CI run", async () => {
    const f = fixture();
    expect(await updatePreviewComment(settings, f.fetcher)).toBe(true);
    expect(f.writes).toHaveLength(1);
    expect(f.writes[0]).toMatchObject({ method: "POST", path: "/issues/7/comments" });
    expect(f.writes[0].body).toContain("https://github.com/owner/repo/actions/runs/20/attempts/3");
    expect(f.writes[0].body).toContain("https://github.com/owner/repo/actions/runs/10/attempts/1");
    expect(f.writes[0].body).toContain("Approve deployment");
  });
  it("patches only the bot marker and includes the verified deployment", async () => {
    const f = fixture();
    f.comments.push({
      id: 1,
      body: marker,
      user: { login: "human", type: "User" },
    }, {
      id: 2,
      body: `${marker}\nold`,
      user: { login: "github-actions[bot]", type: "Bot" },
    });
    f.publish();
    expect(await updatePreviewComment({ ...settings, phase: "success" }, f.fetcher)).toBe(true);
    expect(f.writes[0]).toMatchObject({ method: "PATCH", path: "/issues/comments/2" });
    for (const text of [
      "https://abcd.project.pages.dev/",
      "https://pr-7.project.pages.dev/",
      "https://abcd.project.pages.dev/report",
      sha,
      tested,
    ]) expect(f.writes[0].body).toContain(text);
  });
  it("keeps the previous verified preview and labels its published revision on failure", async () => {
    const f = fixture();
    f.publish(oldSha, oldTested);
    await updatePreviewComment({ ...settings, phase: "failure" }, f.fetcher);
    for (const text of [
      "Last verified preview",
      "https://abcd.project.pages.dev/",
      oldSha,
      oldTested,
      sha,
      tested,
    ]) expect(f.writes[0].body).toContain(text);
    expect(f.writes[0].body).not.toContain("[PR alias]");
  });
  it("distinguishes an older tested checkout for the same PR head", async () => {
    const f = fixture();
    f.publish(sha, oldTested);
    await updatePreviewComment(settings, f.fetcher);
    expect(f.writes[0].body).toContain("Last verified preview");
    expect(f.writes[0].body).not.toContain("[PR alias]");
  });
  it("keeps the verified URL without announcing a new upload when publication is skipped", async () => {
    const f = fixture();
    f.publish();
    await updatePreviewComment({ ...settings, phase: "skipped" }, f.fetcher);
    expect(f.writes[0].body).toContain("Publication skipped");
    expect(f.writes[0].body).toContain("https://abcd.project.pages.dev/");
    expect(f.writes[0].body).not.toContain("Publication completed");
    expect(f.writes[0].body).not.toContain("[PR alias]");
  });
  it("omits invalid provider URLs", async () => {
    const f = fixture();
    f.publish(sha, tested, "https://abcd.project.pages.dev.attacker.test/");
    await updatePreviewComment(settings, f.fetcher);
    expect(f.writes[0].body).not.toContain("attacker.test");
    expect(f.writes[0].body).not.toContain("Open preview");
  });
  it("does not write for closed or changed PRs and newer attempts", async () => {
    const f = fixture();
    f.pr.state = "closed";
    expect(await updatePreviewComment(settings, f.fetcher)).toBe(false);
    f.pr.state = "open";
    f.pr.head.sha = oldSha;
    expect(await updatePreviewComment(settings, f.fetcher)).toBe(false);
    f.pr.head.sha = sha;
    f.run.run_attempt = 2;
    expect(await updatePreviewComment(settings, f.fetcher)).toBe(false);
    expect(f.writes).toEqual([]);
  });
  it("checks freshness again immediately before mutation", async () => {
    const f = fixture();
    f.changeBeforeWrite();
    expect(await updatePreviewComment(settings, f.fetcher)).toBe(false);
    expect(f.writes).toEqual([]);
  });
  it("finds the bot comment beyond the first page", async () => {
    const f = fixture();
    for (let id = 1; id <= 100; id++) {
      f.comments.push({
        id,
        body: "unrelated",
        user: { login: "human", type: "User" },
      });
    }
    f.comments.push({
      id: 101,
      body: marker,
      user: { login: "github-actions[bot]", type: "Bot" },
    });
    await updatePreviewComment(settings, f.fetcher);
    expect(f.writes[0]).toMatchObject({ method: "PATCH", path: "/issues/comments/101" });
  });
});
