import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { buildSearchSections } from "../plugins/search-sections";
import { validateSearchTargets } from "../plugins/validate-search-targets";
import { normalizeSearch, searchDocuments } from "../src/data/documentation-search";

const documents = [
  {
    title: "Interactive components",
    section: "SelectMenu",
    url: "/docs/api/interactive-components#selectmenu",
    category: "api",
    body: "Controlled values and onChange over resolved entities.",
  },
  {
    title: "Controlled selections",
    section: "Scope values",
    url: "/docs/recipes/controlled-selections#scope-values",
    category: "recipes",
    body: "SelectValuesByMessage separates message IDs and select IDs.",
  },
  {
    title: "Threads",
    section: "Replies",
    url: "/docs/guides/threads#replies",
    category: "guides",
    body: "A select menu may appear in a thread reply.",
  },
];

describe("local documentation search", () => {
  it("normalizes camel case, punctuation and accents", () => {
    expect(normalizeSearch("SélectValuesByMessage!")).toBe("select values by message");
    expect(normalizeSearch("onThreadSend")).toBe("on thread send");
  });

  it("ranks an exact API heading above incidental mentions and requires every query word", () => {
    expect(searchDocuments(documents, "SelectMenu")[0]?.url).toBe("/docs/api/interactive-components#selectmenu");
    expect(searchDocuments(documents, "message select IDs").map(item => item.url)).toEqual(["/docs/recipes/controlled-selections#scope-values"]);
    expect(searchDocuments(documents, "threads nonexistent")).toEqual([]);
    expect(searchDocuments(documents, "  ")).toEqual([]);
  });

  it("finds lowercase and concatenated API identifiers", () => {
    expect(searchDocuments(documents, "selectmenu")[0]?.url).toBe(documents[0]!.url);
    expect(searchDocuments(documents, "SELECTMENU")[0]?.url).toBe(documents[0]!.url);
    expect(searchDocuments(documents, "selectvaluesbymessage")[0]?.url).toBe(documents[1]!.url);
    expect(searchDocuments(documents, "onchange")[0]?.url).toBe(documents[0]!.url);
    expect(searchDocuments(documents, "selectmenu nonexistent")).toEqual([]);
  });

  it("keeps results deterministic and limits broad queries", () => {
    const many = Array.from({ length: 50 }, (_, index) => ({ ...documents[0]!, url: `/docs/api/item-${index}` }));
    expect(searchDocuments(many, "SelectMenu")).toHaveLength(30);
    expect(searchDocuments(many, "SelectMenu")).toEqual(searchDocuments(many.slice().reverse(), "SelectMenu"));
  });

  it("ignores fenced headings, decodes generated signatures and retains explicit fragment IDs", () => {
    const sections = buildSearchSections({
      title: "Example",
      url: "/docs/example",
      category: "guides",
      source: `---
title: Example
---
import CodeBlock from '@theme/CodeBlock';
# Example
Intro.
## Controlled selections
Use SelectValuesByMessage.
\`\`\`tsx
## Not a heading
\`\`\`
<CodeBlock language="ts">{"export type SelectValues = Record<string, string[]>;"}</CodeBlock>
## Repeated
First.
## Repeated
Second.
## Special {#kept-id}
Body.`,
    });
    expect(sections.map(item => item.url)).toEqual([
      "/docs/example",
      "/docs/example#controlled-selections",
      "/docs/example#repeated",
      "/docs/example#repeated-1",
      "/docs/example#kept-id",
    ]);
    expect(sections[1]?.body).toContain("SelectValues");
    expect(sections.some(item => item.section === "Not a heading")).toBe(false);
  });
});

it("rejects a renamed indexed heading in rendered production output", async () => {
  const output = await mkdtemp(path.join(tmpdir(), "discord-ui-search-"));
  try {
    await mkdir(path.join(output, "docs"));
    const target = path.join(output, "docs/example.html");
    const entries = [
      {
        title: "Example",
        section: "Stable",
        url: "/docs/example#stable",
        category: "guides",
        body: "",
      },
    ];
    await writeFile(target, "<h2 id=\"stable\">Stable</h2>");
    await expect(validateSearchTargets(output, entries)).resolves.toBeUndefined();
    await writeFile(target, "<h2 id=\"renamed\">Renamed</h2>");
    await expect(validateSearchTargets(output, entries)).rejects.toThrow("/docs/example#stable");
  }
  finally { await rm(output, { recursive: true, force: true }); }
});
