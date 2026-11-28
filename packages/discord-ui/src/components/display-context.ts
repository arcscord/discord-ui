import type { BaseDisplayOptions, ChannelIcons } from "@arcscord/discord-ui-core";
import type { ComponentType, ReactNode } from "react";
import type { DiscordTheme } from "../themes";
import { defaultDisplayOptions } from "@arcscord/discord-ui-core";
import { createContext, use } from "react";
import { themes } from "../themes";

export type { UILabels, UnicodeEmojiOptions } from "@arcscord/discord-ui-core";
export type DisplayOptions = BaseDisplayOptions & {
  icons?: ChannelIcons<ComponentType> | undefined;
  renderCode?: ((content: string, language: string) => ReactNode) | undefined;
};
type DisplayContextValue = DisplayOptions & { scoped: boolean; resolvedTheme: DiscordTheme };
export const defaults: DisplayContextValue = {
  ...defaultDisplayOptions,
  scoped: false,
  resolvedTheme: themes.dark,
};
export const DisplayContext = createContext(defaults);
export function useDisplayOptions(): DisplayContextValue {
  return use(DisplayContext);
}
