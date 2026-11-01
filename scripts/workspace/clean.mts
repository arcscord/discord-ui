import { rm } from "node:fs/promises";
import { join } from "node:path";
import process from "node:process";
import { root } from "../shared/cli.mts";

if (process.argv.length > 2)
  throw new Error("Usage: pnpm clean (no arguments).");
for (const output of [
  "packages/discord-ui/dist",
  "apps/playground/dist",
  "apps/website/build",
  "apps/website/.docusaurus",
  "coverage",
]) {
  await rm(join(root, output), { recursive: true, force: true });
  process.stdout.write(`Removed ${output}\n`);
}
