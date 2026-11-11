import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";
import vue from "@vitejs/plugin-vue";
import { renderToString } from "@vue/server-renderer";
import { build } from "vite";
import { createSSRApp } from "vue";
import { createVueHydrationFixture } from "../../fixtures/vue-hydration.ts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const examples = new URL("../../apps/website/src/examples/vue/", import.meta.url);
const sources: Record<string, string> = {};
for (const file of await readdir(examples)) {
  if (file.endsWith(".vue"))
    sources[file.slice(0, -4)] = await readFile(new URL(file, examples), "utf8");
}
await mkdir(new URL("../../apps/website/src/generated/", import.meta.url), { recursive: true });
await writeFile(new URL("../../apps/website/src/generated/vue-examples.json", import.meta.url), `${JSON.stringify(sources, null, 2)}\n`);
for (const [directory, entry, name] of [
  ["vue-demos", "apps/website/src/examples/vue/entry.ts", "demo"],
  ["vue-ssr", "fixtures/vue-hydration-client.ts", "client"],
]) {
  await build({
    configFile: false,
    define: {
      "process.env.NODE_ENV": JSON.stringify("production"),
    },
    root,
    plugins: [
      vue(),
    ],
    logLevel: "warn",
    build: {
      target: "es2022",
      outDir: directory === "vue-demos"
        ? "apps/website/src/generated/vue-demos"
        : `apps/website/static/generated/${directory}`,
      emptyOutDir: true,
      lib: {
        entry: `${root}${entry}`,
        formats: ["es"],
        fileName: () => `${name}.mjs`,
        cssFileName: "styles",
      },
    },
  });
}
const app = createSSRApp(createVueHydrationFixture());
app.config.idPrefix = "vue-fixture-";
const html = await renderToString(app);
await writeFile(new URL("../../apps/website/static/generated/vue-ssr/index.html", import.meta.url), `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Vue SSR and hydration fixture</title><link rel="stylesheet" href="/generated/vue-ssr/styles.css"></head><body><div id="app">${html}</div><script type="module" src="/generated/vue-ssr/client.mjs"></script></body></html>`);
process.stdout.write(`Generated ${Object.keys(sources).length} Vue examples and the shared SSR/hydration fixture.\n`);

await writeFile(new URL("../../apps/website/src/generated/vue-demos/demo.d.mts", import.meta.url), "export function mount(id: string, element: HTMLElement, prefix: string): () => void;\n");
