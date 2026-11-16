import { copyFile } from "node:fs/promises";

await copyFile(
  new URL("../../packages/discord-ui-core/dist/styles.css", import.meta.url),
  new URL("../../packages/discord-ui-svelte/dist/styles.css", import.meta.url),
);
