import type { ComponentType } from "react";
import * as DiscordComponents from "@arcscord/discord-ui";
import * as ThemeHelpers from "@arcscord/discord-ui/themes";
import * as React from "react";
import { transform } from "sucrase";

const modules: Record<string, unknown> = {
  "react": React,
  "@arcscord/discord-ui": DiscordComponents,
  "@arcscord/discord-ui/themes": ThemeHelpers,
  "@arcscord/discord-ui/styles.css": {},
};

function resolveImport(name: string): unknown {
  if (!Object.hasOwn(modules, name))
    throw new Error(`Unsupported import: ${name}. Available modules: ${Object.keys(modules).join(", ")}.`);
  return modules[name];
}

function evaluateModule(code: string): ComponentType {
  const module = { exports: {} as { default?: ComponentType } };
  // A real module scope: examples cannot access the catalogue's hidden fixtures.
  // eslint-disable-next-line no-new-func -- Execute user-authored playground code in an isolated module scope, as React Live does for JSX.
  const execute = new Function("require", "module", "exports", code);
  execute(resolveImport, module, module.exports);
  if (typeof module.exports.default !== "function")
    throw new TypeError("Export a React component with export default function Preview() { … }.");
  return module.exports.default;
}

export const moduleScope = { __evaluateModule: evaluateModule };

/** Compile the exact displayed module, resolving only its explicit imports. */
export function compileModule(code: string): string {
  const compiled = transform(code, {
    transforms: ["jsx", "imports"],
    production: true,
  }).code;
  return `__evaluateModule(${JSON.stringify(compiled)})`;
}
