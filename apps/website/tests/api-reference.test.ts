import { readFile } from "node:fs/promises";
import * as publicAPI from "@arcscord/discord-ui";
import { expect, it } from "vitest";
import { buildReference } from "../../../scripts/docs/generate-api-reference.mts";
import { componentDocs, documentationLinks } from "../src/data/component-docs.ts";
import { componentExamples } from "../src/data/component-examples.ts";

it("keeps every public signature and typechecked example in the checked-in API reference", async () => {
  const { files, coverage } = await buildReference();
  expect(new Set(coverage.map(item => item.name)).size).toBe(coverage.length);
  for (const [file, content] of files)
    expect(await readFile(new URL(`../../../${file}`, import.meta.url), "utf8"), file).toBe(content);
  for (const item of coverage) {
    const [route, anchor] = item.url.replace("/docs/", "apps/website/docs/").split("#");
    expect(files.get(`${route}.mdx`), item.name).toContain(`## ${item.name}\n`);
    expect(anchor).toBe(item.name.toLowerCase());
    expect(item.example).not.toBe("");
  }
});

it("links every public component and every canonical variant to an actual guide and API section", async () => {
  const runtimeComponents = Object.entries(publicAPI).filter(([name, value]) => typeof value === "function" && name !== "defineTheme").map(([name]) => name).sort();
  expect(Object.keys(componentDocs).sort()).toEqual(runtimeComponents);
  for (const example of componentExamples) {
    const component = example.component ?? example.title;
    const links = documentationLinks(component);
    const [page, anchor] = links.reference.split("#");
    const reference = await readFile(new URL(`../docs/${page!.replace("/docs/", "")}.mdx`, import.meta.url), "utf8");
    expect(reference, example.id).toContain(`## ${component}\n`);
    expect(anchor).toBe(component.toLowerCase());
    await expect(readFile(new URL(`../docs/${links.guide.replace("/docs/", "")}.mdx`, import.meta.url), "utf8")).resolves.toContain("## API reference");
  }
});
