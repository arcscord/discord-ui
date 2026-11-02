export type Draft = { code: string; beforeReset?: string | undefined; beforeResetBaseline?: string | undefined; baseline?: string | undefined };

const drafts = new Map<string, Draft>();
const prefix = "discord-ui:playground-draft:v1:";

/** A stable source signature detects updates without storing another complete module. */
export function sourceVersion(source: string): string {
  let hash = 2166136261;
  for (let index = 0; index < source.length; index++) {
    hash ^= source.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16);
}

/** Read legacy drafts too: a new example must never overwrite a user's edits. */
export function readDraft(id: string, fallback: string, canonicalSource = fallback): Draft {
  const cached = drafts.get(id);
  if (cached)
    return cached;
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(prefix + id) ?? "null");
    if (stored && typeof stored === "object" && "code" in stored && typeof stored.code === "string") {
      const draft: Draft = { code: stored.code };
      if ("beforeReset" in stored && typeof stored.beforeReset === "string")
        draft.beforeReset = stored.beforeReset;
      if ("beforeResetBaseline" in stored && typeof stored.beforeResetBaseline === "string")
        draft.beforeResetBaseline = stored.beforeResetBaseline;
      if ("baseline" in stored && typeof stored.baseline === "string")
        draft.baseline = stored.baseline;
      drafts.set(id, draft);
      return draft;
    }
  }
  catch { /* Private browsing or invalid storage must not block the editor. */ }
  return {
    code: fallback,
    baseline: sourceVersion(canonicalSource),
  };
}

export function writeDraft(id: string, draft: Draft): void {
  drafts.set(id, draft);
  try {
    sessionStorage.setItem(prefix + id, JSON.stringify(draft));
  }
  catch { /* The in-memory draft still survives navigation within this visit. */ }
}
