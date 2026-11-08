import type { Symbol as TSSymbol, Type } from "typescript";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { componentDocs } from "../../apps/website/src/data/component-docs.ts";
import { componentNotes, defaultOverrides, propertyNotes } from "./api-metadata.mts";
import { modelExamples, modelNotes } from "./model-examples.mts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const coreSourceRoot = path.join(root, "packages/discord-ui-core/src");
const sourceRoot = path.join(root, "packages/discord-ui/src");
const options: ts.CompilerOptions = {
  strict: true,
  exactOptionalPropertyTypes: true,
  skipLibCheck: true,
  target: ts.ScriptTarget.ES2022,
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Bundler,
  jsx: ts.JsxEmit.ReactJSX,
  noEmit: true,
};
const pages = {
  "display-components": "Display components",
  "interactive-components": "Interactive components",
  "conversation-components": "Conversation components",
  "models": "Serializable models",
  "callbacks": "Interaction callbacks",
  "themes": "Theme helpers and tokens",
  "highlight": "Optional syntax highlighting",
};
const callbackNames = new Set([
  "ComponentHandlers",
  "ComponentInteractionContext",
  "SelectValues",
  "SelectValuesByMessage",
  "ReactionToggleHandler",
  "SlashCommandHandler",
]);
const entryFiles = ["index.ts", "themes.ts", "highlight.tsx"];
const entryNames = ["@arcscord/discord-ui", "@arcscord/discord-ui/themes", "@arcscord/discord-ui/highlight"];
const code = (source: string) => `<CodeBlock language="ts">{${JSON.stringify(source.trim())}}</CodeBlock>\n`;
const cell = (value: string) => value.replaceAll("|", "\\|").replaceAll("\n", " ");
const inline = (value: string) => `\`${cell(value)}\``;
const slug = (value: string) => value.toLowerCase();
const exampleId = (name: string) => name.replace(/([a-z\d])([A-Z])/gu, "$1-$2").toLowerCase();

export async function buildReference() {
  const program = ts.createProgram([
    ...entryFiles.map(file => path.join(sourceRoot, file)),
    path.join(coreSourceRoot, "themes.ts"),
    path.join(coreSourceRoot, "display-options.ts"),
  ], options);
  const checker = program.getTypeChecker();
  const symbols = new Map<string, { symbol: TSSymbol; entries: string[] }>();
  for (const [index, file] of entryFiles.entries()) {
    const source = program.getSourceFile(path.join(sourceRoot, file))!;
    for (const exported of checker.getExportsOfModule(checker.getSymbolAtLocation(source)!)) {
      const symbol = exported.flags & ts.SymbolFlags.Alias
        ? checker.getAliasedSymbol(exported)
        : exported;
      const existing = symbols.get(exported.name);
      if (existing) {
        existing.entries.push(entryNames[index]!);
      }
      else {
        symbols.set(exported.name, {
          symbol,
          entries: [entryNames[index]!],
        });
      }
    }
  }
  const defaultsSource = program.getSourceFile(path.join(coreSourceRoot, "display-options.ts"))!;
  const defaultsVariable = defaultsSource.statements.filter(ts.isVariableStatement).flatMap(statement => statement.declarationList.declarations).find(declaration => declaration.name.getText() === "defaultDisplayOptions")!;
  const defaultsObject = defaultsVariable.initializer as ts.ObjectLiteralExpression;
  const labelsObject = (defaultsObject.properties.find(property => property.name?.getText() === "labels") as ts.PropertyAssignment).initializer as ts.ObjectLiteralExpression;
  const labelDefaults = Object.fromEntries(labelsObject.properties.filter(ts.isPropertyAssignment).map(property => [
    property.name.getText(),
    property.initializer.getText(),
  ]));
  const labelsExample = `{ ${Object.entries(labelDefaults).map(([key, value]) => `${key}: ${value}`).join(", ")} }`;
  const themeSource = program.getSourceFile(path.join(coreSourceRoot, "themes.ts"))!;
  const tokenDeclaration = themeSource.statements.filter(ts.isVariableStatement).flatMap(statement => statement.declarationList.declarations).find(declaration => declaration.name.getText() === "themeTokenProperties")!;
  const tokens = (tokenDeclaration.initializer as ts.AsExpression).expression as ts.ObjectLiteralExpression;
  const tokenMap = Object.fromEntries(tokens.properties.filter(ts.isPropertyAssignment).map(property => [
    property.name.getText(),
    (property.initializer as ts.StringLiteral).text,
  ]));
  const destinations = new Map<string, string>();
  for (const name of symbols.keys()) {
    let page: string;
    const component = name.endsWith("Props")
      ? name.slice(0, -5)
      : name;
    if (component in componentDocs) {
      page = componentDocs[component as keyof typeof componentDocs][0];
    }
    else if (name === "DisplayOptions" || name === "UILabels") {
      page = "display-components";
    }
    else if ([
      "defineTheme",
      "resolveTheme",
      "themes",
      "themeTokenProperties",
      "DiscordTheme",
      "ThemeInput",
      "ThemeName",
      "ThemeOverrides",
      "ThemeTokens",
      "themeStyle",
    ].includes(name)) {
      page = "themes";
    }
    else if (name === "renderHighlightedCode") {
      page = "highlight";
    }
    else if (callbackNames.has(name)) {
      page = "callbacks";
    }
    else {
      page = "models";
    }
    destinations.set(name, page);
  }
  function format(type: Type, location: ts.Node): string {
    return checker.typeToString(type, location, ts.TypeFormatFlags.NoTruncation | ts.TypeFormatFlags.UseAliasDefinedOutsideCurrentScope).replace(/import\("[^"]+"\)\./gu, "");
  }
  function symbolType(symbol: TSSymbol): Type {
    return symbol.flags & ts.SymbolFlags.TypeAlias
      ? checker.getDeclaredTypeOfSymbol(symbol)
      : checker.getTypeOfSymbolAtLocation(symbol, symbol.valueDeclaration ?? symbol.declarations![0]!);
  }
  function table(type: Type, location: ts.Node, defaults: Record<string, string> = {}, token = false): string {
    if (type.isUnion()) {
      if (type.types.every(branch => branch.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection))) {
        return type.types.map((branch, index) => `#### Variant ${index + 1}\n\n${table(branch, location, defaults, token)}`).join("\n");
      }
      return "The declaration lists the permitted alternatives; no additional object fields apply.\n";
    }
    if (!(type.flags & (ts.TypeFlags.Object | ts.TypeFlags.Intersection)))
      return "";
    const properties = checker.getPropertiesOfType(type);
    const indexInfos = checker.getIndexInfosOfType(type);
    if (!properties.length && !indexInfos.length)
      return "";
    const rows = ["| Field | Required | Type | Default / fallback | Meaning |", "| --- | --- | --- | --- | --- |"];
    for (const property of properties) {
      const field = property.name;
      const declaration = property.valueDeclaration ?? property.declarations?.[0] ?? location;
      const propertyType = checker.getTypeOfSymbolAtLocation(property, location);
      const forbidden = ts.isPropertySignature(declaration) && declaration.type?.kind === ts.SyntaxKind.NeverKeyword;
      const doc = ts.displayPartsToString(property.getDocumentationComment(checker));
      const description = propertyNotes[field] ?? doc ?? "";
      if (!description && !token)
        throw new Error(`Missing field explanation: ${field} in ${location.getText().slice(0, 70)}`);
      rows.push(`| ${inline(field)} | ${forbidden
        ? "Forbidden"
        : property.flags & ts.SymbolFlags.Optional
          ? "No"
          : "Yes"} | ${inline(forbidden
        ? "never"
        : format(propertyType, declaration))} | ${defaults[field]
        ? inline(defaults[field]!)
        : "—"} | ${cell(description || "Semantic CSS token value; missing overrides inherit the selected base theme.")} |`);
    }
    for (const index of indexInfos) rows.push(`| ${inline(`[key: ${format(index.keyType, location)}]`)} | Per key | ${inline(format(index.type, location))} | — | Keys and values follow the mapping contract described above. |`);
    return `${rows.join("\n")}\n`;
  }
  function componentDefaults(name: string, node: ts.Node): Record<string, string> {
    const result: Record<string, string> = { ...defaultOverrides[name] };
    const source = node.getSourceFile();
    const functionNames = new Set([
      name,
      `${name}Content`,
      name === "SelectMenu"
        ? "SelectMenuInput"
        : "",
    ]);
    for (const statement of source.statements) {
      if (!ts.isFunctionDeclaration(statement) || !functionNames.has(statement.name?.text ?? ""))
        continue;
      for (const parameter of statement.parameters) {
        if (!ts.isObjectBindingPattern(parameter.name))
          continue;
        for (const binding of parameter.name.elements) {
          if (binding.initializer)
            result[binding.propertyName?.getText() ?? binding.name.getText()] = binding.initializer.getText();
        }
      }
    }
    return result;
  }
  function signature(name: string, symbol: TSSymbol): string {
    const declaration = symbol.declarations![0]!;
    if (ts.isTypeAliasDeclaration(declaration)) {
      const helpers = new Map<string, string>();
      function findHelpers(node: ts.Node) {
        if (ts.isTypeReferenceNode(node)) {
          const target = checker.getSymbolAtLocation(node.typeName);
          const actual = target?.flags && target.flags & ts.SymbolFlags.Alias
            ? checker.getAliasedSymbol(target)
            : target;
          const helper = actual?.declarations?.[0];
          if (helper && ts.isTypeAliasDeclaration(helper) && helper.getSourceFile() === declaration.getSourceFile() && !symbols.has(actual!.name) && !helpers.has(actual!.name)) {
            helpers.set(actual!.name, helper.getText());
            findHelpers(helper.type);
          }
        }
        ts.forEachChild(node, findHelpers);
      }
      findHelpers(declaration.type);
      return `${[
        ...helpers.values(),
      ].join("\n\n")}${helpers.size ? "\n\n" : ""}${declaration.getText()}`;
    }
    const signatures = checker.getSignaturesOfType(symbolType(symbol), ts.SignatureKind.Call);
    if (signatures.length)
      return signatures.map(item => `export function ${name}${checker.signatureToString(item, declaration, ts.TypeFormatFlags.NoTruncation)};`).join("\n");
    return `export const ${name}: ${format(symbolType(symbol), declaration)};`;
  }
  function related(symbol: TSSymbol): string {
    const names = new Set<string>();
    function visit(node: ts.Node) {
      if (ts.isTypeReferenceNode(node) && destinations.has(node.typeName.getText()) && node.typeName.getText() !== symbol.name)
        names.add(node.typeName.getText());
      ts.forEachChild(node, visit);
    }
    for (const node of symbol.declarations ?? []) {
      visit(ts.isFunctionDeclaration(node)
        ? node.type ?? node
        : node);
    }
    return names.size
      ? `\nRelated types: ${[...names].map(name => `[${name}](/docs/api/${destinations.get(name)}#${slug(name)})`).join(", ")}.\n`
      : "";
  }
  const sections = new Map<string, string[]>(Object.keys(pages).map(page => [page, []]));
  const coverage: { name: string; entries: string[]; url: string; example: string }[] = [];
  const examples: string[] = [];
  for (const [name, { symbol, entries }] of symbols) {
    const page = destinations.get(name)!;
    const declaration = symbol.declarations![0]!;
    const isComponent = name in componentDocs;
    const isProps = name.endsWith("Props") && name.slice(0, -5) in componentDocs;
    let text = `## ${name}\n\n`;
    let example = "";
    const importFrom = entries[0]!;
    text += code(`import ${symbol.flags & ts.SymbolFlags.TypeAlias
      ? "type "
      : ""}{ ${name} } from "${importFrom}";`);
    if (isComponent || isProps) {
      const component = isProps
        ? name.slice(0, -5)
        : name;
      example = exampleId(component);
      if (!componentNotes[component])
        throw new Error(`Missing component behavior: ${component}`);
      const [_, guide] = componentDocs[component as keyof typeof componentDocs];
      text += `\n${componentNotes[component]}\n\n[Usage guide](/docs/guides/${guide}) · [${isProps ? "Component" : "Props type"}](#${slug(isProps
        ? component
        : `${component}Props`)})\n\n`;
      if (isComponent) {
        text += code(signature(name, symbol));
        const props = symbols.get(`${name}Props`)!.symbol;
        text += `\n### Props\n\nOptional props without a listed default remain absent; the behavior note describes local-state and wrapper fallbacks. Callback arguments are included in their type.\n\n${table(symbolType(props), props.declarations![0]!, componentDefaults(name, declaration))}`;
        example = exampleId(name);
        text += `\n<ReferenceExample id="${example}" />\n`;
      }
      else {
        text += code(signature(name, symbol));
      }
      const props = isProps
        ? symbol
        : symbols.get(`${name}Props`)!.symbol;
      text += related(props);
    }
    else if (name === "DisplayOptions" || name === "UILabels") {
      text += name === "DisplayOptions"
        ? "\nDisplay configuration, not a serializable message model: renderCode is a callback. DiscordUI accepts a partial configuration, and partial labels, while this type describes the complete configuration.\n\n"
        : "\nComplete interface-label schema. DiscordUI accepts `Partial<UILabels>` and merges English defaults. Keep {name}, {channel} and {count} placeholders where present; locale formatting is separate.\n\n";
      // Escape prose braces for MDX while leaving code declarations untouched.
      text = text.replace("Keep {name}, {channel} and {count}", "Keep `\u007Bname\u007D`, `\u007Bchannel\u007D` and `\u007Bcount\u007D`");
      text += code(signature(name, symbol));
      const type = symbolType(symbol);
      if (name === "UILabels") {
        const rows = ["| Label | English default |", "| --- | --- |"];
        for (const [key, value] of Object.entries(labelDefaults)) rows.push(`| ${inline(key)} | ${inline(value)} |`);
        text += `\n${rows.join("\n")}\n\nAll label fields have type string; optional keys in the declaration remain optional in UILabels.\n`;
      }
      else {
        text += `\n${table(type, declaration, defaultOverrides.DiscordUI)}`;
      }
      const value = name === "UILabels"
        ? labelsExample
        : `{ theme: "dark", locale: "en-US", timeZone: "UTC", entities: {}, allowRemoteMedia: false, labels: ${labelsExample} }`;
      text += `\n### Example\n\n${code(`import type { ${name} } from "@arcscord/discord-ui";\n\nconst configuration: ${name} = ${value};`)}`;
      examples.push(`const example${name}: API.${name} = ${value};`);
      example = "discord-ui";
      text += "\n[Wrapper reference](#discordui) · [Localization guide](/docs/guides/localization)\n";
    }
    else if (page === "themes") {
      const notes: Record<string, string> = {
        defineTheme: "Creates an immutable custom theme description. name is required; extends defaults to dark; tokens defaults to an empty override map; colorScheme inherits unless explicit. Parent tokens merge without mutating the parent. The preset base remains available to compiled CSS.",
        resolveTheme: "Available from /themes only. Resolves a preset name/custom object and merges per-scope overrides (default `{}`). Returns a new theme object; it does not register global state.",
        themeStyle: "Available from /themes only. Converts supplied semantic token keys to their CSS custom-property names in a React CSSProperties object. It does not validate contrast or apply a stylesheet.",
        themes: "Readonly preset descriptions: light uses colorScheme=light; ash and dark use colorScheme=dark. Preset token maps are empty because their palette is supplied by compiled CSS.",
        themeTokenProperties: "Readonly map from each typed semantic token key to its public CSS custom property. Consumers still import styles.css. Values are CSS strings, not contrast-validated colors.",
        ThemeTokens: "Complete map: every token key is required with a string CSS value. Prefer ThemeOverrides for a partial customization. The table below describes all accepted keys.",
        ThemeOverrides: "Partial token map; omitted keys inherit the base CSS preset and parent overrides. Wrapper overrides win over selected-theme tokens.",
        DiscordTheme: "Reusable theme description with name, retained CSS base, light/dark color scheme and readonly partial token overrides. Supply it to DiscordUI.theme.",
        ThemeName: "The three supported preset names: light, ash and dark.",
        ThemeInput: "A preset ThemeName or a complete DiscordTheme object. Custom themes are passed directly rather than globally registered.",
      };
      if (!notes[name])
        throw new Error(`Missing theme note: ${name}`);
      text += `\n${notes[name]}\n\n${code(signature(name, symbol))}`;
      if (["themeTokenProperties", "ThemeTokens", "ThemeOverrides"].includes(name)) {
        text += `\n| Token key | CSS variable | Value |\n| --- | --- | --- |\n${Object.entries(tokenMap).map(([key, value]) => `| ${inline(key)} | ${inline(value)} | CSS string |`).join("\n")}\n`;
      }
      else if (name === "DiscordTheme") {
        text += `\n${table(symbolType(symbol), declaration)}`;
      }
      const sample = name === "themeStyle"
        ? "const style = themeStyle({ accent: \"#5865f2\" });"
        : name === "resolveTheme"
          ? "const preview = resolveTheme(\"ash\", { accent: \"#5865f2\" });"
          : name === "themes"
            ? "const preview = themes.light;"
            : name === "themeTokenProperties"
              ? "const accentProperty = themeTokenProperties.accent;"
              : name === "ThemeTokens"
                ? "function accentOf(tokens: ThemeTokens): string { return tokens.accent; }"
                : name === "defineTheme"
                  ? "const preview = defineTheme({ name: \"violet\", extends: \"ash\", tokens: { accent: \"#a7a9ff\" } });"
                  : `const preview: ${name} = ${name === "ThemeOverrides"
                    ? "{ accent: \"#5865f2\" }"
                    : name === "DiscordTheme"
                      ? "{ name: \"violet\", base: \"ash\", colorScheme: \"dark\", tokens: { accent: \"#a7a9ff\" } }"
                      : "\"dark\""};`;
      text += `\n### Example\n\n${code(`import ${symbol.flags & ts.SymbolFlags.TypeAlias
        ? "type "
        : ""}{ ${name} } from "${importFrom}";\n\n${sample}`)}\n[Theme guide and rendered example](/docs/guides/themes)\n`;
      examples.push(`{ ${sample.replaceAll(name, `API.${name}`)} }`);
      example = "discord-ui";
      text += related(symbol);
    }
    else if (page === "highlight") {
      text += "\nOpt-in renderer returning a code React element from (content, language). Language is lowercased. Registered languages are javascript, typescript, json, css, bash and python; unsupported languages return escaped plain code. It does not sanitize arbitrary custom renderer output.\n\n";
      text += code(signature(name, symbol));
      text += "\n<HighlightExample />\n\n<CodeBlock language=\"tsx\" title=\"HighlightModule.tsx\">{highlightSource}</CodeBlock>\n\nImport the compiled stylesheet once. This entry is opt-in and is not supported as a runtime playground import. The main component entry does not enable it. [Markdown guide](/docs/guides/markdown) · [Playground behavior](/docs/playground)\n";
      example = "highlight module (typechecked and SSR tested)";
    }
    else {
      if (!modelNotes[name] || !modelExamples[name])
        throw new Error(`Missing authored model description/example: ${name}`);
      text += `\n${modelNotes[name]}\n\n${code(signature(name, symbol))}\n${table(symbolType(symbol), declaration)}`;
      const typeName = name === "SelectDefaultValue"
        ? `${name}<"user">`
        : name;
      const prefix = "import type * as API from \"@arcscord/discord-ui\";\n\nconst author: API.MessageAuthor = { id: \"sam\", displayName: \"Sam\" };\nconst timestamp = \"2026-11-01T10:24:00Z\";\nconst message: API.MessageView = { id: \"message\", author, timestamp, body: { kind: \"text\", content: \"Hello\" } };";
      const declarations = modelExamples[name]!.map((value, index) => `const example${index + 1}: API.${typeName} = ${value};`);
      text += `\n### Valid example${declarations.length > 1
        ? "s"
        : ""}\n\n${code(`${prefix}\n\n${declarations.join("\n")}`)}`;
      examples.push(...modelExamples[name]!.map((value, index) => `const example${name}${index}: API.${typeName} = ${value};`));
      text += related(symbol);
      const guide = name.includes("Select") || /Button|Handlers|InteractionContext/u.test(name)
        ? "interactions"
        : /Thread/u.test(name)
          ? "threads"
          : /Channel/u.test(name)
            ? "channels"
            : /Slash/u.test(name)
              ? "composer"
              : /Reaction/u.test(name)
                ? "reactions"
                : /Embed/u.test(name)
                  ? "embeds"
                  : /Media|File|Gallery|Thumbnail/u.test(name)
                    ? "media"
                    : /Component|Container|Section|Separator|ActionRow|TextDisplay/u.test(name)
                      ? "components-v2"
                      : "messages";
      text += `\n[Usage guide and runnable example](/docs/guides/${guide})\n`;
      example = `guides/${guide} (typed module and browser checks)`;
    }
    sections.get(page)!.push(text);
    coverage.push({
      name,
      entries,
      url: `/docs/api/${page}#${slug(name)}`,
      example,
    });
  }
  // Compile all model/configuration/helper examples against public built imports.
  const examplePath = path.join(root, "apps/website/src/api-reference-validation.ts");
  const sampleSource = `import type * as API from "@arcscord/discord-ui";\nimport { defineTheme, resolveTheme, themeStyle, themes, themeTokenProperties } from "@arcscord/discord-ui/themes";\nimport type { ThemeTokens } from "@arcscord/discord-ui";\nconst author: API.MessageAuthor = { id: "sam", displayName: "Sam" };\nconst timestamp = "2026-11-01T10:24:00Z";\nconst message: API.MessageView = { id: "message", author, timestamp, body: { kind: "text", content: "Hello" } };\n${examples.map(item => item.replaceAll("API.resolveTheme", "resolveTheme").replaceAll("API.themeStyle", "themeStyle").replaceAll("API.defineTheme", "defineTheme").replaceAll("API.themes", "themes").replaceAll("API.themeTokenProperties", "themeTokenProperties").replaceAll("API.ThemeTokens", "ThemeTokens")).join("\n")}`;
  const host = ts.createCompilerHost(options);
  const originalGetSourceFile = host.getSourceFile.bind(host);
  host.getSourceFile = (fileName, languageVersion, onError, shouldCreateNewSourceFile) => fileName === examplePath
    ? ts.createSourceFile(fileName, sampleSource, ts.ScriptTarget.ES2022, true)
    : originalGetSourceFile(fileName, languageVersion, onError, shouldCreateNewSourceFile);
  const samples = ts.createProgram([examplePath], options, host);
  const diagnostics = ts.getPreEmitDiagnostics(samples);
  if (diagnostics.length) {
    throw new Error(ts.formatDiagnosticsWithColorAndContext(diagnostics, {
      getCurrentDirectory: () => root,
      getCanonicalFileName: name => name,
      getNewLine: () => "\n",
    }));
  }
  const files = new Map<string, string>();
  for (const [page, title] of Object.entries(pages)) {
    const imports = `import CodeBlock from '@theme/CodeBlock';\n${page.includes("components")
      ? "import ReferenceExample from '@site/src/components/docs/ReferenceExample';\n"
      : ""}${page === "highlight"
      ? "import HighlightExample from '@site/src/components/docs/HighlightModule';\nimport highlightSource from '!!../../plugins/documentation-source-loader.mjs!@site/src/components/docs/HighlightModule.tsx';\n"
      : ""}`;
    files.set(`apps/website/docs/api/${page}.mdx`, `---\ntitle: ${title}\ndescription: Public signatures, fields, examples and behavior for ${title.toLowerCase()}.\n---\n\n${imports}\n<div className="api-reference-page">\n\n# ${title}\n\nSignatures and field tables are extracted from the public TypeScript contracts. Behavior notes and examples are maintained alongside the generator. Model optionality does not imply a runtime default. Field tables scroll horizontally at narrow widths.\n\n[Public entry points](/docs/api/entry-points) · [API index](/docs/api-reference)\n\n${sections.get(page)!.join("\n")}\n</div>\n`);
  }
  const manifest = JSON.parse(await readFile(path.join(root, "packages/discord-ui/package.json"), "utf8")) as { exports: Record<string, unknown> };
  if (Object.keys(manifest.exports).sort().join(",") !== [
    ".",
    "./styles.css",
    "./themes",
    "./highlight",
  ].sort().join(",")) {
    throw new Error("Update entry-point documentation for the changed package exports");
  }
  files.set("apps/website/documentation-api-map.md", `# Public API coverage\n\nGenerated by \`pnpm docs:api\`. Every public symbol has an authored behavior note, exact signature, field table where applicable and a validated example destination. Model and helper examples compile against built public imports. Component examples reuse the canonical catalogue modules (SSR/browser validation). The stylesheet is documented separately at /docs/api/entry-points.\n\n| Export | Entry points | Reference | Example / validation |\n| --- | --- | --- | --- |\n${coverage.map(row => `| ${inline(row.name)} | ${row.entries.map(inline).join(", ")} | [${row.name}](${row.url}) | ${row.example} |`).join("\n")}\n`);
  return { files, coverage };
}

export async function writeReference(check = false) {
  const { files, coverage } = await buildReference();
  for (const [file, content] of files) {
    const target = path.join(root, file);
    if (check) {
      if (await readFile(target, "utf8").catch(() => "") !== content)
        throw new Error(`Stale API reference: ${file}; run pnpm docs:api`);
    }
    else {
      await mkdir(path.dirname(target), { recursive: true });
      await writeFile(target, content);
    }
  }
  return coverage.length;
}
if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  const count = await writeReference(process.argv.includes("--check"));
  process.stdout.write(`${process.argv.includes("--check")
    ? "Checked"
    : "Generated"} API reference for ${count} public symbols.\n`);
}
