import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const entry = fileURLToPath(new URL("../../packages/discord-ui-svelte/dist/index.d.ts", import.meta.url));
const program = ts.createProgram([entry], {
  strict: true,
  exactOptionalPropertyTypes: true,
  skipLibCheck: true,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
});
const checker = program.getTypeChecker();
const source = program.getSourceFile(entry);
const moduleSymbol = source && checker.getSymbolAtLocation(source);
if (!moduleSymbol)
  throw new Error("Build the Svelte library before generating the API reference.");

const exports = new Map(checker.getExportsOfModule(moduleSymbol).map(symbol => [
  symbol.name,
  symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol,
]));
const react = await readFile(new URL("../../packages/discord-ui/src/index.ts", import.meta.url), "utf8");
const components = [
  ...react.matchAll(/^export \{ ([^}]+) \} from "\.\/components\//gmu),
]
  .flatMap(match => match[1]!.split(", "))
  .sort();
const output = [
  "---",
  "title: Svelte API reference",
  "---",
  "",
  "# Svelte API reference",
  "",
  "Generated from the built public Svelte declarations. Import components and their",
  "props from the package root. Callbacks take the shared core arguments, and",
  "content props accept typed Svelte snippets.",
  "",
];
for (const name of components) {
  const props = exports.get(`${name}Props`);
  if (!exports.get(name)?.valueDeclaration || !props)
    throw new Error(`Missing Svelte parity export for ${name}`);
  output.push(`## ${name}`, "", "| Prop | Required | Type |", "| --- | --- | --- |");
  for (const property of checker.getDeclaredTypeOfSymbol(props).getProperties()) {
    const declaration = property.valueDeclaration ?? property.declarations?.[0];
    if (!declaration)
      throw new Error(`Missing declaration for ${name}.${property.name}`);
    const type = checker.typeToString(checker.getTypeOfSymbolAtLocation(property, declaration), declaration, ts.TypeFormatFlags.NoTruncation)
      .replace(/import\("[^"]+"\)\./gu, "")
      .replaceAll("|", "\\|")
      .replaceAll("\n", " ");
    output.push(`| **${property.name}** | ${property.flags & ts.SymbolFlags.Optional
      ? "No"
      : "Yes"} | \`${type}\` |`);
  }
  output.push("");
}
output.push(
  "## Additional entry points",
  "",
  "- **styles.css** supplies the scoped stylesheet and all three presets.",
  "- **themes** re-exports the core theme helpers, presets and types.",
  "- **highlight** exports **HighlightedCode** and **HighlightedCodeProps**. Pass the code and language supplied to the **renderCode** snippet.",
  "",
);

const destination = new URL("../../apps/website/docs/svelte/api.mdx", import.meta.url);
const document = output.join("\n");
if (process.argv.includes("--check")) {
  if (await readFile(destination, "utf8") !== document)
    throw new Error("Svelte API reference is stale; run pnpm docs:api.");
}
else {
  await writeFile(destination, document);
}
process.stdout.write(`Verified Svelte API parity for ${components.length} components.\n`);
