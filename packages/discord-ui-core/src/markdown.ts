// Parsing rules adapted from AutoThreads; see THIRD_PARTY_NOTICES.
import { parse } from "discord-markdown-parser";

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
