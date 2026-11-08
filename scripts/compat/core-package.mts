import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { pnpm, root, run } from "../shared/cli.mts";

export async function checkCorePackage(temporary: string): Promise<string> {
  const library = join(root, "packages/discord-ui-core");
  const manifest = JSON.parse(await readFile(join(library, "package.json"), "utf8")) as { version: string };
  await pnpm(["pack", "--pack-destination", temporary], library);
  const archive = join(temporary, `arcscord-discord-ui-core-${manifest.version}.tgz`);
  const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).split("\n");
  for (const entry of [
    "index",
    "themes",
    "markdown",
    "emoji",
    "highlight",
  ]) {
    for (const extension of ["mjs", "d.mts"])
      assert(entries.includes(`package/dist/${entry}.${extension}`), `Missing core export: ${entry}.${extension}`);
  }
  for (const file of [
    "README.md",
    "LICENSE",
    "THIRD_PARTY_NOTICES",
    "CHANGELOG.md",
    "dist/styles.css",
  ])
    assert(entries.includes(`package/${file}`), `Missing core packaged file: ${file}`);
  assert(!entries.some(entry => /^package\/(?:src|tests)\//u.test(entry)), "Core sources and tests must not be packaged.");

  const consumer = join(temporary, "core-only");
  await mkdir(consumer);
  const typescript = JSON.parse(await readFile(join(root, "node_modules/typescript/package.json"), "utf8")) as { version: string };
  await writeFile(join(consumer, "pnpm-workspace.yaml"), "packages: []\n");
  await writeFile(join(consumer, "package.json"), JSON.stringify({
    private: true,
    type: "module",
    dependencies: { "@arcscord/discord-ui-core": `file:${archive}` },
    devDependencies: { typescript: typescript.version },
  }));
  await writeFile(join(consumer, "tsconfig.json"), JSON.stringify({
    compilerOptions: {
      strict: true,
      exactOptionalPropertyTypes: true,
      noEmit: true,
      target: "ES2022",
      lib: ["ES2022"],
      types: [],
      module: "NodeNext",
      moduleResolution: "NodeNext",
    },
    files: ["types.mts"],
  }));
  await writeFile(join(consumer, "types.mts"), `
import type { MessageView, BaseDisplayOptions, UnicodeEmojiOptions } from "@arcscord/discord-ui-core";
import { defaultDisplayOptions, linkUrl, selectOptions } from "@arcscord/discord-ui-core";
import { defineTheme, themeStyle } from "@arcscord/discord-ui-core/themes";
import { parseMarkdown } from "@arcscord/discord-ui-core/markdown";
import { segmentUnicodeEmoji } from "@arcscord/discord-ui-core/emoji";
import { highlightCode } from "@arcscord/discord-ui-core/highlight";
const message: MessageView = { id: "m", author: { id: "a", displayName: "A" }, timestamp: "2026-11-01T00:00:00Z", body: { kind: "text", content: "Hello" } };
// @ts-expect-error IDs remain strings.
message.id = 1;
// @ts-expect-error Components V2 cannot contain classic embeds.
const invalid: MessageView = { ...message, body: { kind: "components-v2", components: [] }, embeds: [] };
// @ts-expect-error Twemoji requires an explicit source.
const invalidEmoji: UnicodeEmojiOptions = { mode: "twemoji" };
const options: BaseDisplayOptions = defaultDisplayOptions;
const variables = themeStyle(defineTheme({ name: "brand", tokens: { text: "#fff" } }).tokens);
void variables; void invalid; void invalidEmoji; void options;
void linkUrl; void selectOptions; void parseMarkdown("Hello"); void segmentUnicodeEmoji("👋"); void highlightCode("const n = 1", "ts");
`);
  await writeFile(join(consumer, "smoke.mjs"), `
import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { readFile } from "node:fs/promises";
import { defaultDisplayOptions, linkUrl, mediaUrl, formatDiscordTimestamp } from "@arcscord/discord-ui-core";
import { defineTheme, themeStyle } from "@arcscord/discord-ui-core/themes";
import { parseMarkdown } from "@arcscord/discord-ui-core/markdown";
import { segmentUnicodeEmoji } from "@arcscord/discord-ui-core/emoji";
import { highlightCode } from "@arcscord/discord-ui-core/highlight";
const require = createRequire(import.meta.url);
for (const dependency of ["react", "@types/react/package.json", "vue", "svelte", "@angular/core"])
  assert.throws(() => require.resolve(dependency), undefined, "Core must work without " + dependency);
assert.equal(defaultDisplayOptions.timeZone, "UTC");
assert.equal(linkUrl("javascript:alert(1)"), undefined);
assert.equal(mediaUrl("https://example.com/a.png", false), undefined);
assert.equal(themeStyle(defineTheme({ name: "brand", tokens: { text: "#fff" } }).tokens)["--discord-ui-text"], "#fff");
assert.equal(parseMarkdown("- item")[0].kind, "list");
assert(segmentUnicodeEmoji("👋", { unicodeEmoji: { mode: "twemoji", baseUrl: "/emoji" } }).some(segment => segment.source === "/emoji/1f44b.svg"));
assert(JSON.stringify(highlightCode("const n = 1", "ts")).includes("hljs-keyword"));
assert.equal(formatDiscordTimestamp("1793297100", "R", { locale: "en-US", timeZone: "UTC", referenceTime: "2026-10-29T18:00:00Z" }).label, "in 5 minutes");
const stylesheet = await readFile(new URL(import.meta.resolve("@arcscord/discord-ui-core/styles.css")), "utf8");
assert(stylesheet.includes(".arcscord-discord-ui"));
assert(!stylesheet.includes("@import"));
`);
  await pnpm(["install", "--ignore-scripts"], consumer);
  await pnpm(["exec", "tsc", "-p", "tsconfig.json"], consumer);
  await run(process.execPath, ["smoke.mjs"], consumer);

  const dist = join(library, "dist");
  for (const file of await readdir(dist)) {
    if (!/\.(?:mjs|mts)$/u.test(file))
      continue;
    const contents = await readFile(join(dist, file), "utf8");
    assert(!/\bfrom\s*["'](?:react(?:\/[^"']*)?|vue|svelte|@angular\/[^"']*)["']/u.test(contents), `Framework import in core ${file}`);
    assert(!contents.includes("\"use client\""), `Client directive in core ${file}`);
  }
  // Follow emitted local imports: entry-only checks miss a grammar hidden in a shared chunk.
  const visited = new Set<string>();
  async function checkOrdinaryGraph(file: string): Promise<void> {
    if (visited.has(file))
      return;
    visited.add(file);
    const contents = await readFile(join(dist, file), "utf8");
    assert(!/lowlight|highlight\.js|discord-markdown-parser|@twemoji\/parser/u.test(contents), `Optional parser or grammar in ordinary core graph: ${file}`);
    for (const match of contents.matchAll(/(?:from\s*|import\s*)["']\.\/([^"']+)["']/gu))
      await checkOrdinaryGraph(match[1]!);
  }
  await checkOrdinaryGraph("index.mjs");
  await checkOrdinaryGraph("themes.mjs");
  process.stdout.write("Core verified: framework-free tarball, Node runtime, strict declarations, CSS and isolated optional content entries.\n");
  return archive;
}
