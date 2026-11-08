import type { ThemeOverrides } from "@arcscord/discord-ui-core/themes";
import type { CSSProperties } from "react";
import { themeStyle as coreThemeStyle } from "@arcscord/discord-ui-core/themes";

export { defineTheme, resolveTheme, themes, themeTokenProperties } from "@arcscord/discord-ui-core/themes";
export type { DiscordTheme, ThemeInput, ThemeName, ThemeOverrides, ThemeTokens } from "@arcscord/discord-ui-core/themes";

export function themeStyle(tokens: Readonly<ThemeOverrides>): CSSProperties {
  return coreThemeStyle(tokens) as CSSProperties;
}
