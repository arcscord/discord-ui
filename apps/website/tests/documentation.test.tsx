import type { ComponentType } from "react";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import ts from "typescript";
import { expect, it } from "vitest";
import HighlightModule from "../src/components/docs/HighlightModule";

const modules = import.meta.glob<{ default: ComponentType }>("../src/components/docs/guides/*.tsx", { eager: true });

for (const [path, module] of Object.entries(modules)) {
  it(`server-renders the documented module with deterministic initial output: ${path}`, () => {
    const first = renderToStaticMarkup(createElement(module.default));
    expect(first).toContain("arcscord-discord-ui");
    expect(renderToStaticMarkup(createElement(module.default))).toBe(first);
    expect(first).not.toContain("Invalid timestamp");
  });
}

it("resolves full Discord IDs in the documented Markdown instead of displaying raw tokens", () => {
  const html = renderToStaticMarkup(createElement(modules["../src/components/docs/guides/Markdown.tsx"]!.default));
  expect(html).toContain("@Sam");
  expect(html).toContain("#support");
  expect(html).not.toContain("&lt;@");
});

it("renders the optional highlighter example through the separate public entry", () => {
  const html = renderToStaticMarkup(createElement(HighlightModule));
  expect(html).toContain("hljs-keyword");
  expect(html).toContain("greeting");
});

it("keeps every copyable typed module independent of website fixtures and private package paths", async () => {
  const copyable = [
    ...Object.keys(modules),
    "../src/components/docs/FirstMessage.tsx",
    "../src/components/docs/HighlightModule.tsx",
  ];
  const allowed = new Set([
    "react",
    "@arcscord/discord-ui",
    "@arcscord/discord-ui/styles.css",
    "@arcscord/discord-ui/themes",
    "@arcscord/discord-ui/highlight",
  ]);
  for (const file of copyable) {
    const source = await readFile(new URL(file, import.meta.url), "utf8");
    const syntax = ts.createSourceFile(file, source, ts.ScriptTarget.ES2022, true, ts.ScriptKind.TSX);
    const imports = syntax.statements.filter(ts.isImportDeclaration).map(statement => (statement.moduleSpecifier as ts.StringLiteral).text);
    for (const module of imports)
      expect(allowed.has(module), `${file}: ${module}`).toBe(true);
    expect(imports, file).toContain("react");
    expect(imports, file).toContain("@arcscord/discord-ui/styles.css");
    expect(syntax.statements.some(statement => ts.isExportAssignment(statement)
      || (ts.isFunctionDeclaration(statement) && statement.modifiers?.some(modifier => modifier.kind === ts.SyntaxKind.DefaultKeyword))), file).toBe(true);
  }
});
