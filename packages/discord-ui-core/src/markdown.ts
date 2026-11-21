// Parsing rules adapted from AutoThreads; see THIRD_PARTY_NOTICES.
import { parse, rules, SimpleMarkdown } from "discord-markdown-parser";

/** Renderer-neutral nodes. Unsupported parser nodes retain their textual children. */
export type MarkdownNode = {
  type: string;
  content?: string | MarkdownNode[];
  id?: string;
  name?: string;
  fullName?: string;
  target?: string;
  lang?: string;
  level?: number;
  timestamp?: string;
  format?: string;
};
export type MarkdownListItem = { line: number; children: MarkdownNode[] };
export type MarkdownBlock
  = | { kind: "text"; line: number; children: MarkdownNode[] }
    | { kind: "list"; line: number; ordered: boolean; start: number; items: MarkdownListItem[] };

type RawNode = Record<string, unknown>;
function string(value: unknown): string {
  return typeof value === "string" || typeof value === "number"
    ? String(value)
    : "";
}
function normalizeNode(raw: RawNode): MarkdownNode {
  const node: MarkdownNode = {
    type: string(raw.type),
  };
  if (raw.content != null) {
    node.content = Array.isArray(raw.content)
      ? raw.content.map(normalizeNode)
      : string(raw.content);
  }
  for (const key of [
    "id",
    "name",
    "fullName",
    "target",
    "lang",
    "timestamp",
    "format",
  ] as const) {
    if (raw[key] != null)
      node[key] = string(raw[key]);
  }
  if (raw.level != null)
    node.level = Number(raw.level);
  return node;
}
function inline(value: string): MarkdownNode[] {
  const nodes = (parse(value, "extended") as RawNode[]).map(normalizeNode);
  const normalized: MarkdownNode[] = [];
  const isBreak = (node: MarkdownNode | undefined): boolean => node?.type === "br" || node?.type === "newline";
  const isBlock = (node: MarkdownNode | undefined): boolean => [
    "codeBlock",
    "heading",
    "blockQuote",
    "subtext",
  ].includes(node?.type ?? "");
  for (let index = 0; index < nodes.length; index++) {
    const node = nodes[index];
    if (!node)
      continue;
    if (!isBreak(node)) {
      normalized.push(node);
      continue;
    }
    let end = index + 1;
    while (isBreak(nodes[end])) end++;
    // Block margins already represent one source newline; retain intentional blank lines.
    const structural = isBlock(nodes[index - 1]) || isBlock(nodes[end])
      ? 1
      : 0;
    for (let count = index + structural; count < end; count++) normalized.push(nodes[count]!);
    index = end - 1;
  }
  return normalized;
}

// Embed titles and field names accept inline formatting and emojis only;
// mentions, links, headings and blocks stay as source text.
const inlineRules = [
  "escape",
  "strong",
  "em",
  "underline",
  "strikethrough",
  "inlineCode",
  "spoiler",
  "emoji",
  "twemoji",
  "emoticon",
  "timestamp",
  "text",
] as const;
const inlineParser = SimpleMarkdown.parserFor(Object.fromEntries(inlineRules.map(name => [name, rules[name]!])));

function mergeText(nodes: MarkdownNode[]): MarkdownNode[] {
  const merged: MarkdownNode[] = [];
  for (const node of nodes) {
    if (Array.isArray(node.content))
      node.content = mergeText(node.content);
    const previous = merged.at(-1);
    if (node.type === "text" && previous?.type === "text" && typeof previous.content === "string" && typeof node.content === "string")
      previous.content += node.content;
    else
      merged.push(node);
  }
  return merged;
}

/** Parse restricted inline Markdown, as Discord renders embed titles and field names. */
export function parseInlineMarkdown(value: string): MarkdownNode[] {
  return mergeText((inlineParser(value, { inline: true }) as RawNode[]).map(normalizeNode));
}

/** Flatten inline nodes to plain text, for accessible names. */
export function inlineMarkdownText(nodes: MarkdownNode[]): string {
  return nodes.map((node) => {
    if (node.type === "emoji")
      return `:${node.name ?? ""}:`;
    if (node.type === "twemoji")
      return node.name ?? "";
    if (node.type === "timestamp") {
      return `<t:${node.timestamp ?? ""}${node.format
        ? `:${node.format}`
        : ""}>`;
    }
    return Array.isArray(node.content)
      ? inlineMarkdownText(node.content)
      : node.content ?? "";
  }).join("");
}

// Recognize simple list blocks without touching fenced code or multiline spoilers/quotes.
export function parseMarkdown(value: string): MarkdownBlock[] {
  const lines = value.split("\n");
  const output: MarkdownBlock[] = [];
  let buffer: string[] = [];
  let fenced = false;
  let spoiler = false;
  function flush(key: number): void {
    if (buffer.length) {
      output.push({
        kind: "text",
        line: key,
        children: inline(buffer.join("\n")),
      });
      buffer = [];
    }
  }
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index] ?? "";
    if (/^\s*```/u.test(line))
      fenced = !fenced;
    const match = !fenced && !spoiler
      ? /^\s*([-*]|\d+\.) (.+)$/u.exec(line)
      : null;
    if (match) {
      flush(index);
      const ordered = /^\d/u.test(match[1] ?? "");
      const items: MarkdownListItem[] = [];
      const start = Number.parseInt(match[1] ?? "1", 10) || 1;
      let next = index;
      while (next < lines.length) {
        const item = /^\s*([-*]|\d+\.) (.+)$/u.exec(lines[next] ?? "");
        if (!item || /^\d/u.test(item[1] ?? "") !== ordered)
          break;
        items.push({
          line: next,
          children: inline(item[2] ?? ""),
        });
        next++;
      }
      output.push({
        kind: "list",
        line: index,
        ordered,
        start,
        items,
      });
      index = next - 1;
    }
    else {
      buffer.push(line);
    }
    if (!fenced && (line.match(/\|\|/gu)?.length ?? 0) % 2)
      spoiler = !spoiler;
  }
  flush(lines.length);
  return output;
}
