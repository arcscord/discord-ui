import { copyFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { defineConfig } from "tsdown";

export default defineConfig({
  banner: ({ fileName }) => ({
    js: fileName === "themes.mjs"
      ? ""
      : "\"use client\";",
  }),
  entry: ["src/index.ts", "src/highlight.tsx", "src/themes.ts"],
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
      await copyFile(fileURLToPath(import.meta.resolve("@arcscord/discord-ui-core/styles.css")), "dist/styles.css");
    },
  },
});
