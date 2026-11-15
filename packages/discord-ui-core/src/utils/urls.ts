function httpUrl(value: string | undefined): URL | undefined {
  if (!value || [...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127))
    return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url
      : undefined;
  }
  catch { return undefined; }
}

/** Outgoing links are limited to explicit HTTP(S) URLs. */
export function linkUrl(value: string | undefined): string | undefined {
  return httpUrl(value)
    ? value
    : undefined;
}

function isExplicitHttpUrl(value: string, url: URL): boolean {
  return /^https?:\/\/[^/]/iu.test(value) && !value.includes("\\") && !url.username && !url.password;
}

function matchesAllowlist(value: string, url: URL, allowlist: readonly string[] | undefined): boolean {
  if (!allowlist?.length || !isExplicitHttpUrl(value, url))
    return false;
  return allowlist.some((entry) => {
    const allowed = httpUrl(entry);
    if (!allowed || !isExplicitHttpUrl(entry, allowed) || /[?#]/u.test(entry) || allowed.origin !== url.origin)
      return false;
    return allowed.pathname.endsWith("/")
      ? url.pathname.startsWith(allowed.pathname)
      : url.pathname === allowed.pathname;
  });
}

/** Local paths and image data are allowed without accepting executable schemes. */
export function mediaUrl(value: string | undefined, allowRemote = true, allowlist?: readonly string[]): string | undefined {
  if (!value)
    return undefined;
  const url = httpUrl(value);
  if (url) {
    return allowRemote || matchesAllowlist(value, url, allowlist)
      ? value
      : undefined;
  }
  const controls = [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !controls)
    return value;
  if (/^blob:https?:\/\//u.test(value))
    return value;
  if (/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z\d+/=]+$/iu.test(value))
    return value;
  return undefined;
}
