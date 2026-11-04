import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import ts from "typescript";
import { auditBuiltDocs } from "./audit-built-docs.mts";

const root = fileURLToPath(new URL("../../", import.meta.url));
const registry = await readFile(path.join(root, "apps/website/src/generated/examples/index.ts"), "utf8");
const source = ts.createSourceFile("examples.ts", registry, ts.ScriptTarget.ES2022, true);
const declaration = source.statements.filter(ts.isVariableStatement).flatMap(statement => statement.declarationList.declarations).find(item => item.name.getText(source) === "examplePreviews");
if (!declaration?.initializer || !ts.isObjectLiteralExpression(declaration.initializer))
  throw new Error("Missing built example registry; run pnpm build:website first.");
const examples = new Set(declaration.initializer.properties.filter(ts.isPropertyAssignment).map(property => ts.isStringLiteral(property.name)
  ? property.name.text
  : property.name.getText(source)));
const result = await auditBuiltDocs(path.join(root, "apps/website/build"), examples);
process.stdout.write(`Documentation acceptance: ${result.pages} HTML pages, ${result.links} internal links, ${result.assets} local asset references and ${result.examples} example links checked.\n`);
