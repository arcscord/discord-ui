import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import process from "node:process";
import { pnpm, root, run } from "../shared/cli.mts";

if (process.argv.length > 2)
  throw new Error("Usage: pnpm pack:check (no arguments).");
const temporary = await mkdtemp(join(tmpdir(), "discord-ui-consumer-"));
try {
  const library = join(root, "packages/discord-ui");
  await pnpm(["pack", "--pack-destination", temporary], library);
  const metadata = JSON.parse(await readFile(join(library, "package.json"), "utf8")) as { version: string };
  const archive = join(temporary, `arcscord-discord-ui-${metadata.version}.tgz`);
  const entries = execFileSync("tar", ["-tzf", archive], { encoding: "utf8" }).split("\n");
  for (const file of [
    "dist/index.mjs",
    "dist/index.d.mts",
    "dist/styles.css",
    "dist/themes.mjs",
    "dist/themes.d.mts",
    "dist/highlight.mjs",
    "dist/highlight.d.mts",
    "THIRD_PARTY_NOTICES",
    "LICENSE",
    "README.md",
    "AGENTS.md",
    "docs/agent-guide.md",
  ]) {
    assert(entries.includes(`package/${file}`), `Missing packaged file: ${file}`);
  }
  assert(!entries.some(entry => entry.startsWith("package/src/")), "Sources should not be required by consumers.");
  const typescript = JSON.parse(await readFile(join(root, "node_modules/typescript/package.json"), "utf8")) as { version: string };
  const reactTypes = JSON.parse(await readFile(join(root, "node_modules/@types/react/package.json"), "utf8")) as { version: string };
  const react = JSON.parse(await readFile(join(root, "node_modules/react/package.json"), "utf8")) as { version: string };
  await writeFile(join(temporary, "package.json"), JSON.stringify({
    private: true,
    type: "module",
    dependencies: { "@arcscord/discord-ui": `file:${archive}`, "react": react.version, "react-dom": react.version },
    devDependencies: { "typescript": typescript.version, "@types/react": reactTypes.version },
  }));
  await writeFile(join(temporary, "pnpm-workspace.yaml"), "packages: []\n");
  await writeFile(join(temporary, "smoke.mjs"), `
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { Message, DiscordUI, ChannelView, ThreadPreview } from "@arcscord/discord-ui";
import { defineTheme } from "@arcscord/discord-ui/themes";
const custom = defineTheme({ name: "custom-light", extends: "light", tokens: { codeBackground: "#123456" } });
const themed = renderToStaticMarkup(createElement(DiscordUI, { theme: custom }, "Custom"));
assert(themed.includes('data-base-theme="light"'));
assert(themed.includes("--discord-ui-code-background:#123456"));
const themeModule = await readFile(new URL(import.meta.resolve("@arcscord/discord-ui/themes")), "utf8");
assert(!themeModule.includes('"use client"'), "Theme helpers should be usable in server configuration.");
import { renderHighlightedCode } from "@arcscord/discord-ui/highlight";
assert(renderToStaticMarkup(renderHighlightedCode("const n = 1", "ts")).includes("hljs-keyword"));
const html = renderToStaticMarkup(createElement(Message, { message: {
  id: "smoke", author: { id: "author", displayName: "Packed author" },
  timestamp: "2026-10-29T18:00:00Z", body: { kind: "text", content: "Packed message" },
}}));
assert(html.includes("Packed author"));
assert(html.includes("Packed message"));
const channelHtml = renderToStaticMarkup(createElement(ChannelView, { channel: { id: "packed", name: "packed-channel", messages: [] } }));
assert(channelHtml.includes("Message #packed-channel"));
const threadHtml = renderToStaticMarkup(createElement(ThreadPreview, { thread: { id: "packed-thread", name: "Packed thread", messageCount: 0 } }));
assert(threadHtml.includes("Packed thread"));
const css = await readFile(new URL(import.meta.resolve("@arcscord/discord-ui/styles.css")), "utf8");
assert(css.includes(".arcscord-discord-ui"));
assert(css.includes('[data-theme="light"]'));
assert(css.includes('[data-theme="ash"]'));
assert(css.includes(".dui-container"));
assert(css.includes("--discord-ui-channel-input-background"));
assert(!css.includes("@import"), "Published CSS must not reference source stylesheets.");
`);
  await writeFile(join(temporary, "types.mts"), `
import type { AvatarProps, ChannelViewProps, ComponentInteractionContext, MessageComponentsProps, MessageView, SelectValuesByMessage } from "@arcscord/discord-ui";
const message: MessageView = {
  id: "example", author: { id: "author", displayName: "Example" },
  timestamp: "2026-10-29T18:00:00Z", body: { kind: "text", content: "Hello" },
};
// @ts-expect-error Message IDs must be strings.
message.id = 123;
// @ts-expect-error Unsupported body kinds must not silently pass.
message.body = { kind: "unknown", content: "Hello" };
// @ts-expect-error V2 messages cannot mix in classic embeds.
const invalidV2: MessageView = { id: "v2", author: message.author, timestamp: message.timestamp, body: { kind: "components-v2", components: [] }, embeds: [] };
void invalidV2;
void message;
const selections = { example: { pick: ["a"] } } as const satisfies SelectValuesByMessage;
const props: ChannelViewProps = {
  channel: { id: "channel", name: "general", messages: [message] as const },
  selectValuesByMessage: selections,
  activeThreadId: null,
  onButtonClick: (_id, context) => { const typed: ComponentInteractionContext = context; void typed; },
  onSelectChange: (_id, _values) => {},
};
const components: MessageComponentsProps = { components: [] as const, messageId: "example", selectValues: selections.example };
const avatar: AvatarProps = { author: message.author };
void props;
void components;
void avatar;
`);
  await pnpm(["install", "--ignore-scripts"], temporary);
  const installedLibrary = join(temporary, "node_modules/@arcscord/discord-ui");
  for (const file of ["AGENTS.md", "docs/agent-guide.md"]) {
    const installed = await readFile(join(installedLibrary, file), "utf8");
    assert.equal(installed, await readFile(join(library, file), "utf8"), `Installed agent documentation differs: ${file}`);
    for (const link of installed.matchAll(/\]\((\.[^\s)]+)\)/g)) {
      const target = link[1]!.split("#")[0]!;
      await readFile(resolve(installedLibrary, dirname(file), target));
    }
  }
  const guide = await readFile(join(installedLibrary, "docs/agent-guide.md"), "utf8");
  const examples = [
    ...guide.matchAll(/^```tsx\n([\s\S]*?)^```/gm),
  ];
  assert(examples.length > 0, "The agent guide must include compilable integration examples.");
  const exampleFiles: string[] = [];
  // Model the CSS module declaration normally supplied by the consumer's framework.
  // The runtime smoke check above separately verifies the real packaged stylesheet.
  await writeFile(join(temporary, "styles.d.ts"), "declare module \"@arcscord/discord-ui/styles.css\";\n");
  for (const [index, example] of examples.entries()) {
    const file = `agent-example-${index}.tsx`;
    await writeFile(join(temporary, file), example[1]!);
    exampleFiles.push(file);
  }
  await pnpm([
    "exec",
    "tsc",
    "--noEmit",
    "--strict",
    "--exactOptionalPropertyTypes",
    "--jsx",
    "react-jsx",
    "--module",
    "NodeNext",
    "--moduleResolution",
    "NodeNext",
    "--target",
    "ES2022",
    "types.mts",
    "styles.d.ts",
    ...exampleFiles,
  ], temporary);
  await run(process.execPath, ["smoke.mjs"], temporary);
  process.stdout.write("Package verified: tarball, ESM, declarations, scoped CSS and installed agent documentation/examples.\n");
}
finally {
  await rm(temporary, { recursive: true, force: true });
}
