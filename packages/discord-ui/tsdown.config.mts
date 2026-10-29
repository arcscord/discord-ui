import { copyFile } from "node:fs/promises";
import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
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
      await copyFile("src/styles/styles.css", "dist/styles.css");
    },
  },
});
