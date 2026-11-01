type Draft = { code: string; beforeReset?: string };

const drafts = new Map<string, Draft>();
const prefix = "discord-ui:playground-draft:v1:";

/** Keep drafts within this tab, including when browser storage is unavailable. */
export function readDraft(id: string, fallback: string): Draft {
  const cached = drafts.get(id);
  if (cached)
    return cached;
  try {
    const stored: unknown = JSON.parse(sessionStorage.getItem(prefix + id) ?? "null");
    if (stored && typeof stored === "object" && "code" in stored && typeof stored.code === "string") {
      const draft: Draft = { code: stored.code };
      if ("beforeReset" in stored && typeof stored.beforeReset === "string")
        draft.beforeReset = stored.beforeReset;
      drafts.set(id, draft);
      return draft;
    }
  }
  catch { /* Private browsing or invalid storage must not block the editor. */ }
  return { code: fallback };
}

export function writeDraft(id: string, draft: Draft): void {
  drafts.set(id, draft);
  try {
    sessionStorage.setItem(prefix + id, JSON.stringify(draft));
  }
  catch { /* The in-memory draft still survives navigation within this visit. */ }
}
