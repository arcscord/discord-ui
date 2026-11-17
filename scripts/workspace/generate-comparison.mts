import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import vue from "@vitejs/plugin-vue";
import { build } from "vite";

const frameCss = await readFile(new URL("../../apps/website/src/comparison/frame.css", import.meta.url), "utf8");
const root = fileURLToPath(new URL("../../", import.meta.url));
for (const framework of ["react", "vue", "svelte"] as const) {
  const outDir = `${root}apps/website/static/generated/comparison/${framework}`;
  const entry = framework === "react"
    ? "react.tsx"
    : `${framework}/entry.ts`;
  await build({
    root,
    configFile: false,
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    plugins: framework === "vue"
      ? [
          vue(),
        ]
      : framework === "svelte"
        ? [
            svelte({ configFile: false }),
          ]
        : [],
    oxc: {
      jsx: { runtime: "automatic" },
    },
    logLevel: "warn",
    build: {
      target: "es2022",
      outDir,
      emptyOutDir: true,
      lib: {
        entry: `${root}apps/website/src/comparison/${entry}`,
        formats: ["es"],
        fileName: () => "preview.mjs",
        cssFileName: "styles",
      },
    },
  });
  await mkdir(outDir, { recursive: true });
  await writeFile(`${outDir}/frame.css`, frameCss);
  await writeFile(`${outDir}/index.html`, `<!doctype html>
<html lang="en-US" data-status="loading"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${framework} comparison fixture</title><link rel="stylesheet" href="/generated/comparison/${framework}/styles.css"><link rel="stylesheet" href="/generated/comparison/${framework}/frame.css"></head>
<body><main id="capture" aria-label="Comparison fixture"><div id="app"></div></main><aside class="frame-diagnostics" aria-label="Local diagnostics"><p id="status" role="status">Loading native preview…</p><h2>Observable state</h2><pre id="state"></pre><h2>Native events</h2><pre id="events"></pre></aside><script type="module" src="/generated/comparison/${framework}/preview.mjs"></script></body></html>\n`);
}
