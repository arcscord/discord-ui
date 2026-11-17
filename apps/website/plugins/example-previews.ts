import type { LoadContext, Plugin } from "@docusaurus/types";
import { execFile } from "node:child_process";
import path from "node:path";
import process from "node:process";
import { promisify } from "node:util";

const execute = promisify(execFile);

/** Regenerate native previews before compilation and when canonical sources change. */
export default function examplePreviews(context: LoadContext): Plugin {
  const root = path.resolve(context.siteDir, "../..");
  return {
    name: "canonical-example-previews",
    getPathsToWatch() {
      return [
        path.join(context.siteDir, "src/data/**/*.ts"),
        path.join(context.siteDir, "src/components/playground/export-code.ts"),
        path.join(root, "fixtures/**/*.ts"),
        path.join(root, "scripts/workspace/generate-website-examples.mts"),
        path.join(context.siteDir, "src/comparison/**/*.{ts,tsx,vue,svelte,css}"),
        path.join(root, "scripts/workspace/generate-comparison.mts"),
      ];
    },
    async loadContent() {
      await Promise.all(["generate-website-examples.mts", "generate-comparison.mts"].map(script => execute(process.execPath, [
        path.join(root, "scripts/workspace", script),
      ], { cwd: root })));
    },
  };
}
