import type { ReactNode } from "react";
import type { MessageEntities } from "../model/content";
import type { DiscordTheme, ThemeInput, ThemeOverrides } from "../themes";
import { createContext, use } from "react";
import { themes } from "../themes";

export type UILabels = { thread: string; openThread: string; closeThread: string; threadMessageSingular: string; threadMessagePlural: string; threadNoRecentMessages: string; messages: string; emptyChannel: string; messagePlaceholder: string; sendMessage: string; spoiler: string; showSpoiler: string; hideSpoiler: string; mediaUnavailable: string; invalidTimestamp: string };
export type DisplayOptions = {
  theme: ThemeInput;
  tokens?: ThemeOverrides;
  locale: string;
  timeZone: string;
  referenceTime?: string;
  entities: MessageEntities;
  allowRemoteMedia: boolean;
  renderCode?: ((content: string, language: string) => ReactNode) | undefined;
  labels: UILabels;
};

type DisplayContextValue = DisplayOptions & { scoped: boolean; resolvedTheme: DiscordTheme };

export const defaults: DisplayContextValue = {
  scoped: false,
  resolvedTheme: themes.dark,
  theme: "dark",
  locale: "en-US",
  timeZone: "UTC",
  // Standalone Markdown also has a deterministic fallback; Message uses its timestamp.
  entities: {},
  allowRemoteMedia: true,
  labels: {
    thread: "Thread",
    openThread: "Open thread",
    closeThread: "Close thread",
    threadMessageSingular: "{count} message",
    threadMessagePlural: "{count} messages",
    threadNoRecentMessages: "No recent messages in this thread.",
    messages: "Messages",
    emptyChannel: "No messages yet.",
    messagePlaceholder: "Message #{channel}",
    sendMessage: "Send message",
    spoiler: "Spoiler",
    showSpoiler: "Reveal spoiler",
    hideSpoiler: "Hide spoiler",
    mediaUnavailable: "Media unavailable",
    invalidTimestamp: "Invalid timestamp",
  },
};
export const DisplayContext = createContext(defaults);
export function useDisplayOptions(): DisplayContextValue {
  return use(DisplayContext);
}
