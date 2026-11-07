import type { ThemeName } from "@arcscord/discord-ui";
import { exampleFixtures, previewEntities } from "../../data/example-fixtures";

// Names only: generating source does not require loading the React components.
const packageImports = {
  ActionRow: true,
  Author: true,
  Avatar: true,
  Button: true,
  ChannelComposer: true,
  ChannelHeader: true,
  ChannelView: true,
  Container: true,
  DiscordUI: true,
  Embed: true,
  Emoji: true,
  File: true,
  LinkButton: true,
  Markdown: true,
  Media: true,
  MediaGallery: true,
  Mention: true,
  Message: true,
  MessageComponents: true,
  MessageContent: true,
  MessageFrame: true,
  MessageHeader: true,
  MessageList: true,
  MessageTimestamp: true,
  Reactions: true,
  ReplyPreview: true,
  Section: true,
  SelectMenu: true,
  Separator: true,
  Spoiler: true,
  TextDisplay: true,
  ThreadPanel: true,
  ThreadPreview: true,
  Thumbnail: true,
  defineTheme: true,
  themeTokenProperties: true,
  themes: true,
} satisfies Record<keyof typeof import("@arcscord/discord-ui"), true>;
const hooks = ["useState", "useEffect", "useRef"];

/** Export the scoped JSX as a standalone module, including its fixtures. */
export function exportCode(code: string, theme: string): string {
  // Literal labels and comments are not dependencies (for example "welcome preview").
  const identifiers = code.replace(/"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\/\/[^\n]*|\/\*[\s\S]*?\*\//gu, "");
  const uses = (name: string): boolean => new RegExp(`\\b${name}\\b`, "u").test(identifiers);
  const names = Object.keys(packageImports).filter(uses);
  const imports = Array.from(new Set(["DiscordUI", ...names])).sort().join(", ");
  const usedHooks = hooks.filter(uses);
  const reactImport = `import React${usedHooks.length
    ? `, { ${usedHooks.join(", ")} }`
    : ""} from "react";`;
  const data = Object.entries(exampleFixtures).filter(([name]) => uses(name)).map(([name, value]) => `const ${name} = ${JSON.stringify(value, null, 2)};`).join("\n\n");
  return `${reactImport}\nimport { ${imports} } from "@arcscord/discord-ui";\nimport "@arcscord/discord-ui/styles.css";\n\nconst previewTheme = "${theme}";\n\n${data}${data ? "\n\n" : ""}const Example = (${code.trim().replace(/;$/u, "")});\n\nexport default function Preview({ theme = previewTheme } = {}) {\n  return (\n    <DiscordUI theme={theme} locale="en-US" timeZone="UTC"\n      entities={${JSON.stringify(previewEntities)}}>\n      <Example theme={theme} />\n    </DiscordUI>\n  );\n}\n`;
}

/** The toolbar edits the visible constant instead of overriding the rendered scope. */
export function readModuleTheme(code: string): ThemeName | undefined {
  return /\bconst\s+previewTheme\s*=\s*["'](light|ash|dark)["']/u.exec(code)?.[1] as ThemeName | undefined;
}

export function changeModuleTheme(code: string, theme: ThemeName): string {
  return code.replace(/(\bconst\s+previewTheme\s*=\s*)["'](?:light|ash|dark)["']/u, `$1"${theme}"`);
}
