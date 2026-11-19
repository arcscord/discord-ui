import type { Identity } from "./eligibility.mts";
import process from "node:process";
import { pathToFileURL } from "node:url";

type Phase = "pending" | "success" | "failure" | "cancelled" | "skipped";
type Comment = { id: number; body: string; user: { login: string; type: string } };
type Published = { url: string; alias: string; headSha: string; testedCheckoutSha: string };
export type CommentSettings = {
  token: string;
  apiUrl: string;
  repository: string;
  repositoryId: string;
  publisherRunId: string;
  publisherRunAttempt: string;
  identity: Identity;
  testedCheckoutSha: string;
  phase: Phase;
};
const marker = "<!-- discord-ui-comparison-preview -->";
const shaPattern = /^[a-f\d]{40}$/u;

/** Maintain one bot comment linking the protected review and the latest verified preview. */
export async function updatePreviewComment(settings: CommentSettings, fetcher: typeof fetch = fetch): Promise<boolean> {
  const { identity, phase, repository } = settings;
  if (!/^[\w.-]+\/[\w.-]+$/u.test(repository)
    || ![
      settings.repositoryId,
      settings.publisherRunId,
      settings.publisherRunAttempt,
      identity.runId,
      identity.runAttempt,
    ].every(value => /^[1-9]\d*$/u.test(value))
    || !Number.isSafeInteger(identity.prNumber) || identity.prNumber < 1
    || !shaPattern.test(identity.headSha) || !shaPattern.test(settings.testedCheckoutSha)
    || ![
      "pending",
      "success",
      "failure",
      "cancelled",
      "skipped",
    ].includes(phase)) {
    throw new Error("Invalid preview comment identity.");
  }
  const root = `${settings.apiUrl.replace(/\/$/u, "")}/repos/${repository}`;
  async function api<T>(route: string, method = "GET", body?: unknown): Promise<T> {
    const response = await fetcher(`${root}${route}`, {
      method,
      headers: { "authorization": `Bearer ${settings.token}`, "accept": "application/vnd.github+json", "content-type": "application/json" },
      ...(body
        ? {
            body: JSON.stringify(body),
          }
        : {}),
    });
    if (!response.ok)
      throw new Error(`Preview comment API request failed (${response.status}).`);
    return await response.json() as T;
  }
  async function pages<T>(route: string): Promise<T[]> {
    const result: T[] = [];
    for (let page = 1; ; page++) {
      const items = await api<T[]>(`${route}${route.includes("?")
        ? "&"
        : "?"}per_page=100&page=${page}`);
      result.push(...items);
      if (items.length < 100)
        return result;
    }
  }
  async function currentRevision(): Promise<boolean> {
    const [pr, run] = await Promise.all([
      api<{ state: string; head: { sha: string }; base: { repo: { id: number } } }>(`/pulls/${identity.prNumber}`),
      api<{ run_attempt: number }>(`/actions/runs/${identity.runId}`),
    ]);
    return pr.state === "open" && pr.head.sha === identity.headSha
      && String(pr.base.repo.id) === settings.repositoryId && String(run.run_attempt) === identity.runAttempt;
  }
  if (!await currentRevision())
    return false;

  // Deployment records keep the last validated URL available even after a failed upload.
  const deployments = await pages<{ id: number; payload: { headSha?: string; testedCheckoutSha?: string }; creator: { login: string } }>(`/deployments?environment=comparison-preview-pr-${identity.prNumber}`);
  let published: Published | undefined;
  for (const deployment of deployments) {
    const payload = deployment.payload;
    if (deployment.creator?.login !== "github-actions[bot]" || !payload
      || !shaPattern.test(payload.headSha ?? "") || !shaPattern.test(payload.testedCheckoutSha ?? "")) {
      continue;
    }
    const statuses = await api<{ state: string; environment_url?: string }[]>(`/deployments/${deployment.id}/statuses?per_page=1`);
    if (statuses[0]?.state !== "success")
      continue;
    const match = /^https:\/\/[a-z0-9]+\.([a-z0-9][a-z0-9-]*)\.pages\.dev\/?$/u.exec(statuses[0].environment_url ?? "");
    if (!match)
      continue;
    published = {
      url: new URL(statuses[0].environment_url!).href,
      alias: `https://pr-${identity.prNumber}.${match[1]}.pages.dev/`,
      headSha: payload.headSha!,
      testedCheckoutSha: payload.testedCheckoutSha!,
    };
    break;
  }
  const publisherUrl = `https://github.com/${repository}/actions/runs/${settings.publisherRunId}/attempts/${settings.publisherRunAttempt}`;
  const ciUrl = `https://github.com/${repository}/actions/runs/${identity.runId}/attempts/${identity.runAttempt}`;
  const messages: Record<Phase, string> = {
    pending: `⏳ Ready for approval. [Approve deployment](${publisherUrl}) → **Review deployments** → **Approve and deploy**.`,
    success: "✅ Publication completed.",
    failure: `❌ Publication failed or approval was rejected. [View publication details](${publisherUrl}).`,
    cancelled: `⏹ Publication cancelled. [View publication details](${publisherUrl}).`,
    skipped: `Publication skipped. [View publication details](${publisherUrl}).`,
  };
  const isCurrentBuild = published?.headSha === identity.headSha && published?.testedCheckoutSha === settings.testedCheckoutSha;
  const previewLinks = published
    ? [`[Open preview](${published.url})`, `[Comparison report](${new URL("report", published.url).href})`]
    : [];
  if (published && phase === "success" && isCurrentBuild)
    previewLinks.push(`[PR alias](${published.alias})`);
  const body = [
    marker,
    "## Comparison preview",
    "",
    messages[phase],
    "",
    `PR head \`${identity.headSha}\``,
    `Tested checkout \`${settings.testedCheckoutSha}\``,
    "",
    `[CI results and artifacts](${ciUrl}) · [Publication run](${publisherUrl})`,
    "",
    ...published
      ? [
          isCurrentBuild
            ? "### Verified preview"
            : "### Last verified preview",
          "",
          previewLinks.join(" · "),
          "",
          `Published head \`${published.headSha}\``,
          `Published tested checkout \`${published.testedCheckoutSha}\``,
        ]
      : [],
  ].join("\n");
  const comments = await pages<Comment>(`/issues/${identity.prNumber}/comments`);
  const existing = comments.find(comment => comment.user.login === "github-actions[bot]" && comment.user.type === "Bot" && comment.body.startsWith(marker));
  // Fetch once more before writing so an obsolete run cannot replace the latest PR status.
  if (!await currentRevision())
    return false;
  if (existing)
    await api(`/issues/comments/${existing.id}`, "PATCH", { body });
  else
    await api(`/issues/${identity.prNumber}/comments`, "POST", { body });
  return true;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await updatePreviewComment({
    token: process.env.GH_TOKEN!,
    apiUrl: process.env.GITHUB_API_URL!,
    repository: process.env.GITHUB_REPOSITORY!,
    repositoryId: process.env.GITHUB_REPOSITORY_ID!,
    publisherRunId: process.env.GITHUB_RUN_ID!,
    publisherRunAttempt: process.env.GITHUB_RUN_ATTEMPT!,
    identity: JSON.parse(process.env.EXPECTED_IDENTITY!),
    testedCheckoutSha: process.env.TESTED_CHECKOUT_SHA!,
    phase: process.env.PREVIEW_PHASE as Phase,
  });
}
