import { readFile, writeFile } from "node:fs/promises";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const entry = fileURLToPath(new URL("../../packages/discord-ui-vue/dist/index.d.ts", import.meta.url));
const program = ts.createProgram([entry], {
  strict: true,
  exactOptionalPropertyTypes: true,
  skipLibCheck: true,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
});
const checker = program.getTypeChecker();
const source = program.getSourceFile(entry)!;
const exports = new Map(checker.getExportsOfModule(checker.getSymbolAtLocation(source)!).map(symbol => [
  symbol.name,
  symbol.flags & ts.SymbolFlags.Alias
    ? checker.getAliasedSymbol(symbol)
    : symbol,
]));
const react = await readFile(new URL("../../packages/discord-ui/src/index.ts", import.meta.url), "utf8");
const components = [
  ...react.matchAll(/^export \{ ([^}]+) \} from "\.\/components\//gmu),
].flatMap(match => match[1]!.split(", "));
const escape = (value: string): string => value.replaceAll("|", "\\|").replaceAll("\n", " ");
let output = `---\ntitle: Vue API reference\n---\n\n# Vue API reference\n\nGenerated from the built public Vue declarations. Each component below corresponds\nto the React component of the same name and uses the shared display models.\nImport components and types from \`@arcscord/discord-ui-vue\`. Models are re-exported\nfrom the core; their constraints are unchanged.\n\nContent props become named slots; events use kebab-case. Listener signatures appear\nbelow as Vue's typed \`on…\` props. \`class\` and \`style\` are native Vue attributes.\n\n`;
for (const component of components) {
  const propsSymbol = exports.get(`${component}Props`);
  if (!exports.has(component) || !propsSymbol)
    throw new Error(`Missing Vue parity export: ${component}`);
  const props = checker.getDeclaredTypeOfSymbol(propsSymbol);
  output += `## ${component}\n\n| Prop / event listener | Required | Type |\n| --- | --- | --- |\n`;
  for (const property of props.getProperties()) {
    const declaration = property.valueDeclaration ?? property.declarations![0]!;
    const type = checker.typeToString(checker.getTypeOfSymbolAtLocation(property, declaration), declaration, ts.TypeFormatFlags.NoTruncation).replace(/import\("[^"]+"\)\./gu, "");
    output += `| \`${property.name}\` | ${property.flags & ts.SymbolFlags.Optional
      ? "No"
      : "Yes"} | \`${escape(type)}\` |\n`;
  }
  for (const [suffix, label] of [
    ["Slots", "Slots"],
    ["Emits", "Events"],
  ]) {
    const symbol = exports.get(`${component}${suffix}`);
    const members = symbol
      ? checker.getDeclaredTypeOfSymbol(symbol).getProperties()
      : [];
    output += `\n${label}: ${members.length
      ? members.map(member => `\`${member.name}\``).join(", ")
      : "none"}.\n`;
  }
  output += "\n";
}
output += `## Themes and highlighting\n\n\`./themes\` re-exports the core presets, token types, \`defineTheme\`,\n\`resolveTheme\` and \`themeStyle\`. \`./highlight\` exports\n\`renderHighlightedCode(content, language)\`, returning Vue nodes for\n\`DiscordUI.renderCode\`. Unknown languages fall back to escaped plain text.\nHighlighting grammars do not enter the ordinary component bundle.\n`;
const destination = new URL("../../apps/website/docs/vue/api.mdx", import.meta.url);
if (process.argv.includes("--check")) {
  if (await readFile(destination, "utf8") !== output)
    throw new Error("Vue API reference is stale; run pnpm docs:api.");
}
else { await writeFile(destination, output); }
process.stdout.write(`Verified Vue API parity for ${components.length} components.\n`);

let matrix = "# React / Vue parity matrix\n\nGenerated from both public entry points. Components are exercised through the shared\nSSR fixtures, Vue docs examples and the browser hydration scenarios. This records\nlocal simulation coverage; it is not Nuxt or live Discord certification.\n\n| React export | Vue export | Public Vue types | Validation |\n| --- | --- | --- | --- |\n";
for (const name of components) {
  matrix += `| ${name} | ${name} | ${name}Props, ${name}Slots, ${name}Emits | Shared SSR / docs component coverage; interaction scenarios in vue.spec.ts |\n`;
}
matrix += "\nShared scenarios: classic/V2 messages, Markdown, embeds/files/media, unavailable media,\nreplies, reactions, all five select kinds, controlled selections/context, local identity\nreset, composition, slash arguments, controlled/local threads, focus, themes and SSR\nhydration. Packed SFC consumers are checked with minimum/development Vue without React.\n";
const matrixFile = new URL("../../packages/discord-ui-vue/docs/parity.md", import.meta.url);
if (process.argv.includes("--check")) {
  if (await readFile(matrixFile, "utf8") !== matrix)
    throw new Error("Vue parity matrix is stale.");
}
else { await writeFile(matrixFile, matrix); }
