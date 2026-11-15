import type { UnicodeEmojiOptions } from "./display-options";
import { parse } from "@twemoji/parser";
import { mediaUrl } from "./utils/urls";

export type UnicodeEmojiSegment
  = | { kind: "text"; text: string; start: number }
    | { kind: "emoji"; text: string; start: number; source: string | undefined };

/** Check whether the entire string is a single Unicode emoji. */
export function isUnicodeEmoji(content: string): boolean {
  const entities = parse(content);
  return entities.length === 1 && entities[0]?.text === content;
}

/** Resolve data only: image loading and failure fallback belong to the renderer. */
export function segmentUnicodeEmoji(content: string, { unicodeEmoji = { mode: "native" }, allowRemoteMedia = true }: {
  unicodeEmoji?: UnicodeEmojiOptions;
  allowRemoteMedia?: boolean;
} = {}): UnicodeEmojiSegment[] {
  if (unicodeEmoji.mode === "native") {
    return [
      { kind: "text", text: content, start: 0 },
    ];
  }
  const baseUrl = unicodeEmoji.baseUrl.replace(/\/+$/u, "");
  const entities = parse(content, {
    buildUrl: codepoints => `${baseUrl}/${codepoints}.svg`,
  });
  const segments: UnicodeEmojiSegment[] = [];
  let offset = 0;
  for (const entity of entities) {
    const [start, end] = entity.indices;
    segments.push({
      kind: "text",
      text: content.slice(offset, start),
      start: offset,
    });
    segments.push({
      kind: "emoji",
      text: entity.text,
      start,
      source: unicodeEmoji.baseUrl
        ? mediaUrl(entity.url, allowRemoteMedia)
        : undefined,
    });
    offset = end;
  }
  segments.push({
    kind: "text",
    text: content.slice(offset),
    start: offset,
  });
  return segments;
}
