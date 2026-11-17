import type { BaseDisplayOptions, DiscordTheme, ThemeOverrides, UILabels } from "@arcscord/discord-ui-core";
import type { Snippet } from "svelte";
import { defaultDisplayOptions, themes, themeStyle } from "@arcscord/discord-ui-core";
import { getContext } from "svelte";

export type DisplayOptions = BaseDisplayOptions & { renderCode?: Snippet<[content: string, language: string]> | undefined };
export type DiscordUIProps = Partial<Omit<DisplayOptions, "labels">> & {
  labels?: Partial<UILabels>;
  class?: string;
  children: Snippet;
};
type DisplayContext = DisplayOptions & { scoped: boolean; resolvedTheme: DiscordTheme };

export const displayKey = Symbol("discord-ui-display");
export function getDisplayOptions(): () => DisplayContext {
  const context = getContext<(() => DisplayContext) | undefined>(displayKey);
  return context ?? (() => ({ ...defaultDisplayOptions, scoped: false, resolvedTheme: themes.dark }));
}

export function hexColor(value: string | undefined): string | undefined {
  return /^#[a-f\d]{6}$/iu.test(value ?? "")
    ? value
    : undefined;
}

export function themeCss(tokens: ThemeOverrides): string {
  return Object.entries(themeStyle(tokens)).map(([property, value]) => `${property}:${value}`).join(";");
}
