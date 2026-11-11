import type { BaseDisplayOptions, DiscordTheme, UILabels } from "@arcscord/discord-ui-core";
import type { InjectionKey, VNodeChild } from "vue";
import { defaultDisplayOptions, themes } from "@arcscord/discord-ui-core";
import { inject } from "vue";

export type DisplayOptions = BaseDisplayOptions & { renderCode?: ((content: string, language: string) => VNodeChild) | undefined };
export type DisplayContextValue = DisplayOptions & { scoped: boolean; resolvedTheme: DiscordTheme };
export type DiscordUIProps = Partial<Omit<DisplayOptions, "labels">> & { labels?: Partial<UILabels> };
export type DiscordUIEmits = Record<string, never>;
export type DiscordUISlots = { default?: () => VNodeChild };
export const displayKey: InjectionKey<DisplayContextValue> = Symbol("discord-ui-display");

/** Each standalone instance gets its own defaults; SSR requests share no mutable state. */
export function useDisplayOptions(): DisplayContextValue {
  return inject(displayKey, undefined) ?? {
    ...defaultDisplayOptions,
    entities: {},
    labels: { ...defaultDisplayOptions.labels },
    unicodeEmoji: { mode: "native" },
    scoped: false,
    resolvedTheme: themes.dark,
  };
}
export const defaults = defaultDisplayOptions;
