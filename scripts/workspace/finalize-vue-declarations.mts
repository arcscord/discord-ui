import { readdir, readFile, rm, writeFile } from "node:fs/promises";
import { extname, join } from "node:path";
import { fileURLToPath } from "node:url";

// Public SFC wrappers expose stable Props/Slots/Emits constructors. Their generated
// compiler-private constructors target the development Vue patch, not the minimum peer.
async function finalizeDeclarations(directory: string): Promise<void> {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) {
      await finalizeDeclarations(path);
    }
    else if (entry.name.endsWith(".vue.d.ts")) {
      await rm(path);
    }
    else if (entry.name.endsWith(".d.ts")) {
      const source = await readFile(path, "utf8");
      // NodeNext resolves .js specifiers to their sibling .d.ts declarations.
      const finalized = source.replace(/(\b(?:from\s+|import\s*(?:\(\s*)?)["'])(\.{1,2}\/[^"'\r\n]+)(["'])/gu, (specifier, prefix: string, target: string, quote: string) =>
        extname(target)
          ? specifier
          : `${prefix}${target}.js${quote}`);
      if (finalized !== source)
        await writeFile(path, finalized);
    }
  }
}
await finalizeDeclarations(fileURLToPath(new URL("../../packages/discord-ui-vue/dist", import.meta.url)));

await writeFile(fileURLToPath(new URL("../../packages/discord-ui-vue/dist/styles.css.d.ts", import.meta.url)), "export {};\n");
