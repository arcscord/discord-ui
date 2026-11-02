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
      ];
    },
    async loadContent() {
      await execute(process.execPath, [
        path.join(root, "scripts/workspace/generate-website-examples.mts"),
      ], { cwd: root });
    },
  };
}
