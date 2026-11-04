import type { LoadedContent } from "@docusaurus/plugin-content-docs";
import type { LoadContext, Plugin } from "@docusaurus/types";
import type { SearchDocument } from "../src/data/documentation-search";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { buildSearchSections } from "./search-sections";
import { validateSearchTargets } from "./validate-search-targets";

/** Use Docusaurus document metadata for canonical routes, including future versions. */
export default function documentationSearch(context: LoadContext): Plugin {
  let indexedDocuments: SearchDocument[] = [];
  return {
    name: "local-documentation-search",
    getPathsToWatch: () => [
      path.join(context.siteDir, "docs/**/*.{md,mdx}"),
    ],
    async allContentLoaded({ allContent, actions }) {
      const content = allContent["docusaurus-plugin-content-docs"]?.default as LoadedContent | undefined;
      if (!content)
        throw new Error("Documentation metadata is required for local search.");
      const documents = content.loadedVersions.flatMap(version => version.docs).filter(document => !document.draft && !document.unlisted);
      const entries = await Promise.all(documents.map(async (document) => {
        const source = await readFile(path.join(context.siteDir, document.source.replace(/^@site\//u, "")), "utf8");
        return buildSearchSections({
          title: document.title,
          url: document.permalink,
          source,
          category: document.id.split("/")[0] ?? "docs",
        });
      }));
      indexedDocuments = entries.flat();
      const index = await actions.createData("search-index.json", indexedDocuments);
      actions.addRoute({
        path: "/search",
        exact: true,
        component: "@site/src/components/search/SearchPage",
        modules: { documents: index },
      });
    },
    async postBuild({ outDir }) {
      await validateSearchTargets(outDir, indexedDocuments);
    },
  };
}
