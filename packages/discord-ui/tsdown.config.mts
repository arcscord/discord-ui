import { readFile, writeFile } from "node:fs/promises";
import { defineConfig } from "tsdown";

export default defineConfig({
  banner: { js: "\"use client\";" },
  entry: ["src/index.ts", "src/highlight.tsx"],
  format: "esm",
  platform: "browser",
  target: "es2022",
  dts: true,
  sourcemap: true,
  clean: true,
  deps: { neverBundle: true },
  outExtensions: () => ({ js: ".mjs", dts: ".d.mts" }),
  hooks: {
    "build:done": async () => {
      const styles = await readFile("src/styles/styles.css", "utf8");
      const imported = await readFile("src/styles/autothreads.css", "utf8");
      // Ship one standalone stylesheet, with no unresolved source imports.
      await writeFile("dist/styles.css", styles.replace("@import \"./autothreads.css\";", imported));
    },
  },
});
