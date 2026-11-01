import type { ThemeName } from "@arcscord/discord-ui";
import { liveScope, previewEntities } from "../../data/live-scope";

const fixtures = [
  "initialChannel",
  "welcome",
  "release",
  "ticket",
  "markdown",
  "demoMedia",
] as const;
const hooks = ["useState", "useEffect", "useRef"];

/** Export the scoped JSX as a standalone module, including its fixtures. */
export function exportCode(code: string, theme: string): string {
  const uses = (name: string): boolean => new RegExp(`\\b${name}\\b`, "u").test(code);
  const names = Object.keys(liveScope).filter(name => ![
    "React",
    ...hooks,
    ...fixtures,
  ].includes(name) && uses(name));
  const imports = Array.from(new Set(["DiscordUI", ...names])).sort().join(", ");
  const usedHooks = hooks.filter(uses);
  const reactImport = `import React${usedHooks.length
    ? `, { ${usedHooks.join(", ")} }`
    : ""} from "react";`;
  const data = fixtures.filter(uses).map(name => `const ${name} = ${JSON.stringify(liveScope[name], null, 2)};`).join("\n\n");
  return `${reactImport}\nimport { ${imports} } from "@arcscord/discord-ui";\nimport "@arcscord/discord-ui/styles.css";\n\nconst previewTheme = "${theme}";\n\n${data}${data ? "\n\n" : ""}const Example = (${code.trim().replace(/;$/u, "")});\n\nexport default function Preview() {\n  return (\n    <DiscordUI theme={previewTheme} locale="en-US" timeZone="UTC"\n      entities={${JSON.stringify(previewEntities)}}>\n      <Example />\n    </DiscordUI>\n  );\n}\n`;
}

/** The toolbar edits the visible constant instead of overriding the rendered scope. */
export function readModuleTheme(code: string): ThemeName | undefined {
  return /\bconst\s+previewTheme\s*=\s*["'](light|ash|dark)["']/u.exec(code)?.[1] as ThemeName | undefined;
}

export function changeModuleTheme(code: string, theme: ThemeName): string {
  return code.replace(/(\bconst\s+previewTheme\s*=\s*)["'](?:light|ash|dark)["']/u, `$1"${theme}"`);
}
