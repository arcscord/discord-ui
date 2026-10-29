import type { CSSProperties } from "react";

/** Typed public tokens mapped to the CSS variables consumed by every primitive. */
export const themeTokenProperties = {
  background: "--discord-ui-background",
  focusBackground: "--discord-ui-row-hover",
  codeBackground: "--discord-ui-code-background",
  spoilerBackground: "--discord-ui-spoiler-hidden",
  quoteBorder: "--discord-ui-quote-border",
  text: "--discord-ui-text",
  muted: "--discord-ui-muted",
  strong: "--discord-ui-strong",
  link: "--discord-ui-link",
  accent: "--discord-ui-accent",
  warning: "--discord-ui-warning",
  border: "--discord-ui-border",
  surface: "--discord-ui-surface",
  embedBorder: "--discord-ui-embed-border",
  embedAccent: "--discord-ui-embed-accent",
  containerSurface: "--discord-ui-container-surface",
  containerOutline: "--discord-ui-container-outline",
  linkButtonBackground: "--discord-ui-link-button-background",
  linkButtonDisabledBackground: "--discord-ui-link-button-disabled-background",
  linkButtonText: "--discord-ui-link-button-text",
  linkButtonDisabledText: "--discord-ui-link-button-disabled-text",
  secondaryBackground: "--discord-ui-secondary-bg",
  secondaryHover: "--discord-ui-secondary-hover",
  secondaryActive: "--discord-ui-secondary-active",
  secondaryBorder: "--discord-ui-secondary-border",
  spoilerHover: "--discord-ui-spoiler-hover",
  spoilerRevealed: "--discord-ui-spoiler-revealed",
  mentionColor: "--discord-ui-mention-color",
  mentionBackground: "--discord-ui-mention-fill",
  mentionHover: "--discord-ui-mention-fill-hover",
  divider: "--discord-ui-divider",
  codeKeyword: "--discord-ui-code-keyword",
  codeString: "--discord-ui-code-string",
  codeNumber: "--discord-ui-code-number",
  codeTitle: "--discord-ui-code-title",
  codeComment: "--discord-ui-code-comment",
} as const;

export type ThemeTokens = { [Key in keyof typeof themeTokenProperties]: string };
export type ThemeOverrides = Partial<ThemeTokens>;
export type DiscordTheme = {
  readonly name: string;
  readonly base: string;
  readonly colorScheme: "light" | "dark";
  readonly tokens: Readonly<ThemeOverrides>;
};

/** Preset colors live in styles/themes.css; no JS/CSS palette duplication. */
export const themes = {
  light: {
    name: "light",
    base: "light",
    colorScheme: "light",
    tokens: {},
  },
  ash: {
    name: "ash",
    base: "ash",
    colorScheme: "dark",
    tokens: {},
  },
  dark: {
    name: "dark",
    base: "dark",
    colorScheme: "dark",
    tokens: {},
  },
} as const satisfies Record<string, DiscordTheme>;

export type ThemeName = keyof typeof themes;
export type ThemeInput = ThemeName | DiscordTheme;

/** Extend a preset or another custom theme without registering global state. */
export function defineTheme({ name, extends: parent = "dark", tokens = {}, colorScheme }: {
  name: string;
  extends?: ThemeInput;
  tokens?: ThemeOverrides;
  colorScheme?: "light" | "dark";
}): DiscordTheme {
  const base = typeof parent === "string"
    ? themes[parent]
    : parent;
  return {
    name,
    base: base.base,
    colorScheme: colorScheme ?? base.colorScheme,
    tokens: {
      ...base.tokens,
      ...tokens,
    },
  };
}

export function resolveTheme(theme: ThemeInput, overrides: ThemeOverrides = {}): DiscordTheme {
  const base = typeof theme === "string"
    ? themes[theme]
    : theme;
  return {
    ...base,
    tokens: {
      ...base.tokens,
      ...overrides,
    },
  };
}

export function themeStyle(tokens: Readonly<ThemeOverrides>): CSSProperties {
  return Object.fromEntries(Object.entries(tokens).map(([key, value]) => [themeTokenProperties[key as keyof ThemeTokens], value])) as CSSProperties;
}
