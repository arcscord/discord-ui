import { rm } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { root } from "../shared/cli.mts";

if (process.argv.length > 2)
  throw new Error("Usage: pnpm clean (no arguments).");
for (const output of [
  "packages/discord-ui/dist",
  "packages/discord-ui-core/dist",
  "packages/discord-ui-vue/dist",
  "packages/discord-ui-svelte/dist",
  "packages/discord-ui-svelte/.svelte-kit",
  "apps/website/src/generated/svelte-demos",
  "apps/website/src/generated/svelte-examples.json",
  "apps/website/src/generated/vue-demos",
  "apps/website/static/generated/vue-ssr",
  "apps/website/build",
  "apps/website/.docusaurus",
  "coverage",
]) {
  await rm(join(root, output), { recursive: true, force: true });
  process.stdout.write(`Removed ${output}\n`);
}
