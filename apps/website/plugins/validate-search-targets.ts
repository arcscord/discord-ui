import type { SearchDocument } from "../src/data/documentation-search";
import { readFile } from "node:fs/promises";
import path from "node:path";

/** Fail production builds when a source/index heading no longer matches rendered HTML. */
export async function validateSearchTargets(outDir: string, documents: readonly SearchDocument[]): Promise<void> {
  const pages = new Map<string, string[]>();
  for (const document of documents) {
    const [route, anchor] = document.url.split("#");
    const anchors = pages.get(route!) ?? [];
    if (anchor)
      anchors.push(anchor);
    pages.set(route!, anchors);
  }
  await Promise.all([...pages].map(async ([route, anchors]) => {
    const target = path.resolve(outDir, `${route.replace(/^\//u, "")}.html`);
    if (!target.startsWith(path.resolve(outDir) + path.sep))
      throw new Error(`Invalid search route: ${route}`);
    const html = await readFile(target, "utf8");
    const ids = new Set([
      ...html.matchAll(/\bid="([^"]+)"/gu),
    ].map(match => match[1]!));
    for (const anchor of anchors) {
      if (!ids.has(anchor))
        throw new Error(`Search target is missing from production HTML: ${route}#${anchor}`);
    }
  }));
}
