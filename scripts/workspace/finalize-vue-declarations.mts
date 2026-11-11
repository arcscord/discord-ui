import { readdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

// Public SFC wrappers expose stable Props/Slots/Emits constructors. Their generated
// compiler-private constructors target the development Vue patch, not the minimum peer.
async function clean(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory())
      await clean(path);
    else if (entry.name.endsWith(".vue.d.ts"))
      await rm(path);
  }
}
await clean(fileURLToPath(new URL("../../packages/discord-ui-vue/dist", import.meta.url)));

await writeFile(fileURLToPath(new URL("../../packages/discord-ui-vue/dist/styles.css.d.ts", import.meta.url)), "export {};\n");
