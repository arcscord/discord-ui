import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { build } from "vite";

const root = fileURLToPath(new URL("../../", import.meta.url));
const examples = new URL("../../apps/website/src/examples/svelte/", import.meta.url);
const generated = new URL("../../apps/website/src/generated/", import.meta.url);
const files = (await readdir(examples)).filter(file => file.endsWith(".svelte")).sort();
const sources = Object.fromEntries(await Promise.all(files.map(async file => [
  file.slice(0, -7),
  await readFile(new URL(file, examples), "utf8"),
])));
await mkdir(generated, { recursive: true });
await writeFile(new URL("svelte-examples.json", generated), `${JSON.stringify(sources, null, 2)}\n`);

await build({
  configFile: false,
  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  root,
  plugins: [
    svelte({ configFile: false }),
  ],
  logLevel: "warn",
  build: {
    target: "es2022",
    outDir: fileURLToPath(new URL("svelte-demos/", generated)),
    lib: {
      entry: fileURLToPath(new URL("entry.ts", examples)),
      formats: ["es"],
      fileName: () => "demo.mjs",
    },
  },
});
await writeFile(new URL("svelte-demos/demo.d.mts", generated), "export function mountExample(id: string, target: HTMLElement): () => void;\n");
