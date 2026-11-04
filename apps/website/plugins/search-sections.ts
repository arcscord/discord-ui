import type { SearchDocument } from "../src/data/documentation-search";

type SourceDocument = { title: string; url: string; category: string; source: string };

function plainText(source: string): string {
  return source
    .replace(/<CodeBlock[^>]*>\{("(?:\\.|[^"\\])*")\}<\/CodeBlock>/gu, (_, value: string) => JSON.parse(value) as string)
    .replace(/^import .*$/gmu, "")
    .replace(/<[^>]*>/gu, " ")
    .replace(/\[([^\]]+)\]\([^)]*\)/gu, "$1")
    .replace(/[`#*|{}]/gu, " ")
    .replace(/\\[nrt]/gu, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

/** Index real h2 sections and prose; ignore headings inside fenced source examples. */
export function buildSearchSections(document: SourceDocument): SearchDocument[] {
  const source = document.source.replace(/^---\n[\s\S]*?\n---\n/u, "");
  const parts: { heading: string; anchor: string; lines: string[] }[] = [
    { heading: "", anchor: "", lines: [] },
  ];
  const occurrences = new Map<string, number>();
  let fence = "";
  for (const line of source.split("\n")) {
    const marker = /^\s*(`{3,}|~{3,})/u.exec(line)?.[1];
    if (marker) {
      fence = fence ? "" : marker[0]!;
      continue;
    }
    if (fence)
      continue;
    const heading = /^## (.+)$/u.exec(line)?.[1];
    if (heading) {
      const clean = heading.replace(/\s*\{#[^}]+\}\s*$/u, "");
      const explicit = /\{#([^}]+)\}/u.exec(heading)?.[1];
      const base = plainText(clean).toLowerCase().replace(/[^\p{L}\p{N}_\-\s]/gu, "").replace(/\s/gu, "-");
      const count = occurrences.get(base) ?? 0;
      occurrences.set(base, count + 1);
      parts.push({
        heading: plainText(clean),
        anchor: explicit ?? `${base}${count
          ? `-${count}`
          : ""}`,
        lines: [],
      });
    }
    else {
      parts.at(-1)!.lines.push(line);
    }
  }
  return parts.map(part => ({
    title: document.title,
    section: part.heading,
    url: `${document.url}${part.anchor
      ? `#${part.anchor}`
      : ""}`,
    category: document.category,
    body: plainText(part.lines.join("\n")).slice(0, 12000),
  }));
}
