import { execFileSync } from "node:child_process";
import { cp, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";

execFileSync(process.execPath, [
  fileURLToPath(new URL("generate-avatars.mts", import.meta.url)),
  "comparison",
], { stdio: "inherit" });
// Reuse the canonical local font and its license without building the documentation.
await cp(new URL("../../apps/website/static/fonts/", import.meta.url), new URL("../../apps/comparison/public/fonts/", import.meta.url), { recursive: true });

// A deterministic decode failure served successfully in both development and production.
await writeFile(new URL("../../apps/comparison/public/generated/avatars/invalid.png", import.meta.url), "not a PNG image");
