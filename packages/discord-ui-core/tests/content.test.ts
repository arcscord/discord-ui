import { describe, expect, it } from "vitest";
import { segmentUnicodeEmoji } from "../src/emoji";
import { highlightCode } from "../src/highlight";
import { inlineMarkdownText, parseInlineMarkdown, parseMarkdown } from "../src/markdown";
import { formatDiscordTimestamp, parseTimestamp } from "../src/utils/timestamps";

describe("framework-neutral content data", () => {
  it("retains nested formatting, entities and serializable list blocks", () => {
    const blocks = parseMarkdown("**bold _inside_** <@123456789012345678>\n3. first\n4. second");
    expect(JSON.parse(JSON.stringify(blocks))).toEqual(blocks);
    expect(blocks[0]).toMatchObject({
      kind: "text",
      children: [
        {
          type: "strong",
          content: [
            { type: "text", content: "bold " },
            {
              type: "em",
              content: [
                { type: "text", content: "inside" },
              ],
            },
          ],
        },
        { type: "text", content: " " },
        { type: "user", id: "123456789012345678" },
      ],
    });
    expect(blocks[1]).toMatchObject({
      kind: "list",
      ordered: true,
      start: 3,
      items: [
        {
          children: [
            { type: "text", content: "first" },
          ],
        },
        {
          children: [
            { type: "text", content: "second" },
          ],
        },
      ],
    });
  });
  it("keeps list-like text inside fences and multiline spoilers", () => {
    for (const content of ["```txt\n- code\n```", "||hidden\n- secret\n||"]) {
      expect(parseMarkdown(content).map(block => block.kind)).toEqual(["text"]);
    }
  });
  it("removes structural newlines while retaining intentional blank lines", () => {
    const compact = parseMarkdown("```ts\nx\n```\nAfter");
    const blank = parseMarkdown("```ts\nx\n```\n\nAfter");
    expect(compact[0]).toMatchObject({
      children: [
        { type: "codeBlock", content: "x", lang: "ts" },
        { type: "text", content: "After" },
      ],
    });
    expect(blank[0]).toMatchObject({
      children: [
        { type: "codeBlock" },
        { type: "br" },
        { type: "text", content: "After" },
      ],
    });
  });
  it("segments composite emoji and preserves all original text", () => {
    const content = "Hello 👨‍👩‍👧‍👦 ❤️ 🇨🇭!";
    const segments = segmentUnicodeEmoji(content, {
      unicodeEmoji: { mode: "twemoji", baseUrl: "/emoji///" },
      allowRemoteMedia: false,
    });
    expect(segments.map(segment => segment.text).join("")).toBe(content);
    const emoji = segments.filter(segment => segment.kind === "emoji");
    expect(emoji).toHaveLength(3);
    expect(emoji[1]).toMatchObject({ text: "❤️", source: "/emoji/2764.svg" });
    expect(segmentUnicodeEmoji(content)).toEqual([
      { kind: "text", start: 0, text: content },
    ]);
  });
  it.each([
    "https://example.com/emoji",
    "//example.com/emoji",
    "javascript:emoji",
    "",
  ])("falls back to text for blocked sources: %s", (baseUrl) => {
    const segments = segmentUnicodeEmoji("👋", {
      unicodeEmoji: { mode: "twemoji", baseUrl },
      allowRemoteMedia: false,
    });
    expect(segments.find(segment => segment.kind === "emoji")).toMatchObject({ source: undefined });
  });
  it("exposes optional highlight tokens, aliases and unknown-language fallback", () => {
    const result = highlightCode("const x = '<script>';", "TS");
    expect(result.language).toBe("ts");
    expect(JSON.stringify(result.tokens)).toContain("hljs-keyword");
    expect(JSON.parse(JSON.stringify(result))).toEqual(result);
    expect(highlightCode("<script>", "unknown")).toEqual({
      language: undefined,
      tokens: [
        { type: "text", value: "<script>" },
      ],
    });
  });
});
describe("explicit timestamp formatting", () => {
  it("accepts explicit offset suffixes while rejecting invalid and local dates", () => {
    expect(parseTimestamp("2026-10-29T18:00:00+02:30")?.toISOString()).toBe("2026-10-29T15:30:00.000Z");
    expect(parseTimestamp("2026-10-29T18:00:00-03:30")?.toISOString()).toBe("2026-10-29T21:30:00.000Z");
    for (const timestamp of [
      "2026-10-29",
      "2026-10-29T18:00:00",
      "invalidTZ",
      "2026-99-29T18:00:00Z",
      "2026-10-29T18:00:00+25:00",
    ])
      expect(parseTimestamp(timestamp)).toBeUndefined();
  });

  it("rejects repeated timestamp separators without polynomial suffix scanning", () => {
    const repeated = "T".repeat(50000);
    const started = performance.now();
    expect(parseTimestamp(`${repeated}invalid`)).toBeUndefined();
    expect(parseTimestamp(`${repeated}Z`)).toBeUndefined();
    expect(parseTimestamp(`${repeated}+02:00`)).toBeUndefined();
    expect(performance.now() - started).toBeLessThan(500);
  });

  it("requires timezone metadata and a valid reference for relative times", () => {
    expect(parseTimestamp("2026-10-29T18:00:00")).toBeUndefined();
    expect(parseTimestamp("invalid")).toBeUndefined();
    expect(parseTimestamp("2026-10-29T18:00:00Z")?.toISOString()).toBe("2026-10-29T18:00:00.000Z");
    const options = { locale: "en-US", timeZone: "UTC", referenceTime: "2026-10-29T18:00:00Z" };
    expect(formatDiscordTimestamp("1793297100", "R", options)?.label).toBe("in 5 minutes");
    expect(formatDiscordTimestamp("1793297100", "R", { ...options, referenceTime: "invalid" })).toBeUndefined();
  });

  it("restricts embed title markup to inline formatting, emojis and timestamps", () => {
    const nodes = parseInlineMarkdown("<:id:974006684643127296> **Ticket** <@123> <#456> @everyone # x [l](https://a.test) https://b.test");
    expect(nodes).toEqual([
      { type: "emoji", id: "974006684643127296", name: "id" },
      { type: "text", content: " " },
      {
        type: "strong",
        content: [
          { type: "text", content: "Ticket" },
        ],
      },
      { type: "text", content: " <@123> <#456> @everyone # x [l](https://a.test) https://b.test" },
    ]);
    expect(inlineMarkdownText(nodes)).toBe(":id: Ticket <@123> <#456> @everyone # x [l](https://a.test) https://b.test");
    expect(parseInlineMarkdown("||s|| `c` <t:0:R> ~~x~~ __u__ *e*").map(node => node.type))
      .toEqual([
        "spoiler",
        "text",
        "inlineCode",
        "text",
        "timestamp",
        "text",
        "strikethrough",
        "text",
        "underline",
        "text",
        "em",
      ]);
  });
});
