import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { extname, join } from "node:path";
import process from "node:process";
import { chromium } from "@playwright/test";
import { pnpm, root, run } from "../shared/cli.mts";

export async function checkVuePackage(archives: string, coreArchive: string): Promise<void> {
  const library = join(root, "packages/discord-ui-vue");
  const metadata = JSON.parse(await readFile(join(library, "package.json"), "utf8")) as { version: string; peerDependencies: { vue: string } };
  assert.equal(metadata.peerDependencies.vue, "^3.5.0");
  await pnpm(["pack", "--pack-destination", archives], library);
  const archive = join(archives, `arcscord-discord-ui-vue-${metadata.version}.tgz`);
  const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" });
  for (const entry of [
    "index.mjs",
    "index.d.ts",
    "themes.mjs",
    "themes.d.ts",
    "highlight.mjs",
    "highlight.d.ts",
    "styles.css",
  ])
    assert(entries.includes(`package/dist/${entry}\n`), `Missing Vue export ${entry}`);
  for (const file of [
    "README.md",
    "AGENTS.md",
    "CHANGELOG.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES",
    "docs/agent-guide.md",
  ])
    assert(entries.includes(`package/${file}\n`), `Missing Vue documentation ${file}`);
  assert(!/package\/(?:src|tests)\//u.test(entries));
  const packed = JSON.parse(execFileSync("tar", ["-xOf", archive, "package/package.json"], { encoding: "utf8" })) as { dependencies: Record<string, string> };
  assert(packed.dependencies["@arcscord/discord-ui-core"]?.startsWith("^"));
  assert(!Object.keys(packed.dependencies).some(name => /react/u.test(name)));
  const dev = (JSON.parse(await readFile(join(root, "package.json"), "utf8")) as { devDependencies: Record<string, string> }).devDependencies;
  for (const version of new Set(["3.5.0", dev.vue!])) {
    const consumer = await mkdtemp(join(tmpdir(), "discord-ui-vue-consumer-"));
    try {
      await writeFile(join(consumer, "package.json"), JSON.stringify({
        private: true,
        type: "module",
        dependencies: {
          "@arcscord/discord-ui-vue": `file:${archive}`,
          "@arcscord/discord-ui-core": `file:${coreArchive}`,
          "vue": version,
        },
        devDependencies: {
          "@vue/server-renderer": version,
          "typescript": dev.typescript,
          "vue-tsc": dev["vue-tsc"],
          "vite": dev.vite,
          "@vitejs/plugin-vue": dev["@vitejs/plugin-vue"],
        },
      }));
      await writeFile(join(consumer, "pnpm-workspace.yaml"), `packages: []\noverrides:\n  "@arcscord/discord-ui-core": ${JSON.stringify(`file:${coreArchive}`)}\n`);
      await writeFile(join(consumer, "tsconfig.json"), JSON.stringify({
        compilerOptions: {
          strict: true,
          exactOptionalPropertyTypes: true,
          noEmit: true,
          module: "ESNext",
          moduleResolution: "Bundler",
          target: "ES2022",
          lib: ["ES2022", "DOM", "DOM.Iterable"],
          types: ["vite/client"],
        },
        files: ["App.vue"],
      }));
      await writeFile(join(consumer, "App.vue"), `<script setup lang="ts">
import type { MessageView, ButtonProps, SectionSlots, ChannelViewEmits } from "@arcscord/discord-ui-vue";
import { Button, ChannelComposer, DiscordUI, Message, SelectMenu } from "@arcscord/discord-ui-vue";
import { defineTheme } from "@arcscord/discord-ui-vue/themes";
import { renderHighlightedCode } from "@arcscord/discord-ui-vue/highlight";
import { ref } from "vue";
import "@arcscord/discord-ui-vue/styles.css";
const draft = ref(""); const selected = ref<string[]>([]); const clicks = ref(0); const sent = ref("");
const theme = defineTheme({ name: "packed", extends: "light", tokens: { accent: "#5865f2" } });
const message: MessageView = { id: "packed", author: { id: "a", displayName: "Packed Vue" }, timestamp: "2026-11-01T00:00:00Z", body: { kind: "markdown", content: "**Packed message**" } };
// @ts-expect-error V2 cannot mix in classic embeds.
const invalidMessage: MessageView = { ...message, body: { kind: "components-v2", components: [] }, embeds: [] };
// @ts-expect-error Vue uses variant for button appearance.
const invalidButton: ButtonProps = { label: "Bad", variant: "unknown" };
// @ts-expect-error Slots return Vue nodes, not arbitrary objects.
const invalidSlot: SectionSlots = { accessory: () => ({ invalid: true }) };
// @ts-expect-error Controlled thread updates are string IDs or null.
const invalidEvent: ChannelViewEmits["update:activeThreadId"] = [42];
void invalidMessage; void invalidButton; void invalidSlot; void invalidEvent;
function checkRef(instance: InstanceType<typeof SelectMenu>): void {
  instance.$emit("update:values", ["a"]);
  // @ts-expect-error Component refs keep their event payload types.
  instance.$emit("update:values", [42]);
  // @ts-expect-error Unknown events are not accepted by a component ref.
  instance.$emit("unknown", []);
}
void checkRef;
</script><template><DiscordUI :theme="theme" :render-code="renderHighlightedCode"><Message :message="message" /><Button label="Increment" @click="clicks++" /><p role="status">Clicks: {{ clicks }}; Sent: {{ sent }}</p><SelectMenu v-model:values="selected" :menu="{ id: 'pick', kind: 'string-select', minValues: 0, options: [{ value: 'a', label: 'Alpha' }] }" /><ChannelComposer v-model="draft" channel-name="packed" @send="sent = $event; draft = ''" /></DiscordUI></template>`);
      await writeFile(join(consumer, "client.ts"), `import { createSSRApp } from "vue"; import App from "./App.vue"; const app = createSSRApp(App); app.config.idPrefix = "packed-"; app.mount("#app"); document.documentElement.dataset.hydrated = "true";`);
      await writeFile(join(consumer, "index.html"), "<!doctype html><html lang=\"en\"><head><meta charset=\"utf-8\"><title>Packed Vue</title></head><body><div id=\"app\"><!--SSR_APP--></div><script type=\"module\" src=\"/client.ts\"></script></body></html>");
      await writeFile(join(consumer, "vite.config.mjs"), `import { defineConfig } from "vite"; import vue from "@vitejs/plugin-vue"; export default defineConfig({plugins: [vue()]});`);
      await writeFile(join(consumer, "server.ts"), `import { createSSRApp } from "vue"; import { renderToString } from "@vue/server-renderer"; import { readFile, writeFile } from "node:fs/promises"; import App from "./App.vue"; const app = createSSRApp(App); app.config.idPrefix = "packed-"; const markup = await renderToString(app); const page = await readFile("dist/index.html", "utf8"); await writeFile("dist/index.html", page.replace("<!--SSR_APP-->", markup));`);
      await writeFile(join(consumer, "smoke.mjs"), `import assert from "node:assert/strict"; import { createRequire } from "node:module"; import { readFile } from "node:fs/promises"; import { defineTheme } from "@arcscord/discord-ui-vue/themes"; const require = createRequire(import.meta.url); for (const name of ["react", "react-dom", "@types/react/package.json"]) assert.throws(() => require.resolve(name)); assert.equal(defineTheme({name:"packed"}).base,"dark"); assert.equal(await readFile(new URL(import.meta.resolve("@arcscord/discord-ui-vue/styles.css")),"utf8"), await readFile(new URL(import.meta.resolve("@arcscord/discord-ui-core/styles.css")),"utf8"));`);
      await pnpm(["install", "--ignore-scripts"], consumer);
      await pnpm([
        "exec",
        "vue-tsc",
        "-p",
        "tsconfig.json",
      ], consumer);
      await run(process.execPath, ["smoke.mjs"], consumer);
      await pnpm(["exec", "vite", "build"], consumer);
      await pnpm([
        "exec",
        "vite",
        "build",
        "--ssr",
        "server.ts",
        "--outDir",
        "server",
      ], consumer);
      await run(process.execPath, ["server/server.js"], consumer);
      const page = await readFile(join(consumer, "dist/index.html"), "utf8");
      assert(page.includes("Packed message") && !page.includes("<!--SSR_APP-->"));
      const server = createServer((request, response) => {
        const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
        if (pathname === "/favicon.ico") {
          response.writeHead(204).end();
          return;
        }
        const path = join(consumer, "dist", pathname === "/"
          ? "index.html"
          : pathname);
        readFile(path).then((data) => {
          response.setHeader("Content-Type", ({ ".js": "text/javascript", ".css": "text/css", ".html": "text/html" } as Record<string, string>)[extname(path)] ?? "application/octet-stream");
          response.end(data);
        }).catch(() => { response.writeHead(404).end(); });
      });
      await new Promise<void>((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
      });
      try {
        const address = server.address();
        assert(address && typeof address !== "string");
        const browser = await chromium.launch();
        try {
          const page = await browser.newPage();
          const errors: string[] = [];
          page.on("pageerror", error => errors.push(error.message));
          page.on("console", (message) => {
            if (message.type() === "error" || message.text().includes("Hydration"))
              errors.push(message.text());
          });
          await page.goto(`http://127.0.0.1:${address.port}/`);
          await page.locator("html[data-hydrated=\"true\"]").waitFor();
          await page.getByRole("button", { name: "Increment", exact: true }).click();
          assert((await page.getByRole("status").textContent())?.includes("Clicks: 1"));
          const combo = page.getByRole("combobox");
          await combo.focus();
          await combo.press("ArrowDown");
          await combo.press("Enter");
          assert((await combo.textContent())?.includes("Alpha"));
          await page.getByRole("textbox", { name: "Message #packed" }).fill("Packed send");
          await page.getByRole("textbox", { name: "Message #packed" }).press("Enter");
          assert((await page.getByRole("status").textContent())?.includes("Sent: Packed send"));
          assert.deepEqual(errors, []);
        }
        finally { await browser.close(); }
      }
      finally {
        await new Promise<void>((resolve, reject) => server.close(error => error
          ? reject(error)
          : resolve()));
      }
      process.stdout.write(`Vue ${version} verified: independent tarball consumer without React, strict SFC types, client/server builds and real Chromium hydration.\n`);
    }
    finally { await rm(consumer, { recursive: true, force: true }); }
  }
  const main = await readFile(join(library, "dist/index.mjs"), "utf8");
  assert(!/from ["'](?:react|lowlight|highlight\.js|@arcscord\/discord-ui["'])/u.test(main));
  for (const file of await readdir(join(library, "dist"))) {
    if (file.endsWith(".mjs") && file !== "highlight.mjs")
      assert(!(await readFile(join(library, "dist", file), "utf8")).includes("@arcscord/discord-ui-core/highlight"));
  }
}
