import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { registerHooks } from "node:module";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

// Website data uses bundler-style imports. Resolve its local TS modules in Node 26.
registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier.startsWith(".") && context.parentURL) {
      for (const extension of [".ts", "/index.ts"]) {
        const candidate = new URL(specifier + extension, context.parentURL);
        if (existsSync(candidate)) {
          return {
            ...nextResolve(candidate.href, context),
            format: "module-typescript",
          };
        }
      }
    }
    const resolved = nextResolve(specifier, context);
    return resolved.url.endsWith(".ts")
      ? { ...resolved, format: "module-typescript" }
      : resolved;
  },
});
const dataPath = "../../apps/website/src/data/component-examples.ts";
const exportPath = "../../apps/website/src/components/playground/export-code.ts";
const { componentExamples } = await import(dataPath) as { componentExamples: { id: string; code: string }[] };
const { exportCode } = await import(exportPath) as { exportCode: (code: string, theme: string) => string };
const target = new URL("../../apps/website/src/generated/examples/", import.meta.url);
await mkdir(target, { recursive: true });
const imports: string[] = [];
const entries: string[] = [];
for (const [index, example] of componentExamples.entries()) {
  if (!/^[a-z\d-]+$/u.test(example.id))
    throw new Error(`Invalid example ID: ${example.id}`);
  const source = exportCode(example.code, "dark");
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { jsx: ts.JsxEmit.ReactJSX, module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
  });
  // The site already loads the distributed stylesheet globally.
  await writeFile(new URL(`${example.id}.mjs`, target), outputText.replace("import \"@arcscord/discord-ui/styles.css\";", ""));
  await writeFile(new URL(`${example.id}.d.mts`, target), "import type { ComponentType } from \"react\";\nimport type { ThemeName } from \"@arcscord/discord-ui\";\ndeclare const Preview: ComponentType<{ theme?: ThemeName }>;\nexport default Preview;\n");
  imports.push(`import Example${index} from "./${example.id}.mjs";`);
  entries.push(`  ${JSON.stringify(example.id)}: Example${index},`);
}
await writeFile(new URL("index.ts", target), `// Generated from the canonical editable examples. Do not edit.\nimport type { ComponentType } from "react";\nimport type { ThemeName } from "@arcscord/discord-ui";\n${imports.join("\n")}\nexport const examplePreviews: Record<string, ComponentType<{ theme?: ThemeName }>> = {\n${entries.join("\n")}\n};\n`);
await writeFile(new URL("landing.ts", target), `${[
  "export { default as AnnouncementPreview } from \"./announcement.mjs\";",
  "export { default as TranscriptPreview } from \"./transcript.mjs\";",
  "export { default as ArcadePreview } from \"./arcade.mjs\";",
].join("\n")}\n`);
process.stdout.write(`Generated ${componentExamples.length} precompiled examples in ${fileURLToPath(target)}\n`);
