/** Outgoing links are limited to explicit HTTP(S) URLs. */
export function linkUrl(value: string | undefined): string | undefined {
  if (!value || [...value].some(char => char.charCodeAt(0) <= 32 || char.charCodeAt(0) === 127))
    return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? value
      : undefined;
  }
  catch { return undefined; }
}

/** Local paths and image data are allowed without accepting executable schemes. */
export function mediaUrl(value: string | undefined, allowRemote = true): string | undefined {
  if (!value)
    return undefined;
  if (linkUrl(value))
    return allowRemote ? value : undefined;
  const controls = [...value].some(char => char.charCodeAt(0) < 32 || char.charCodeAt(0) === 127);
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\") && !controls)
    return value;
  if (/^blob:https?:\/\//u.test(value))
    return value;
  if (/^data:image\/(?:png|jpeg|gif|webp);base64,[a-z\d+/=]+$/iu.test(value))
    return value;
  return undefined;
}
