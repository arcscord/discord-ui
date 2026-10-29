import type { ReactNode } from "react";
import type { MessageEntities } from "../model/content";
import { createContext, use } from "react";

export type UILabels = { spoiler: string; showSpoiler: string; hideSpoiler: string; mediaUnavailable: string; invalidTimestamp: string };
export type DisplayOptions = {
  theme: "dark" | "light";
  locale: string;
  timeZone: string;
  referenceTime?: string;
  entities: MessageEntities;
  allowRemoteMedia: boolean;
  renderCode?: ((content: string, language: string) => ReactNode) | undefined;
  labels: UILabels;
};

type DisplayContextValue = DisplayOptions & { scoped: boolean };

export const defaults: DisplayContextValue = {
  scoped: false,
  theme: "dark",
  locale: "en-US",
  timeZone: "UTC",
  // Standalone Markdown also has a deterministic fallback; Message uses its timestamp.
  entities: {},
  allowRemoteMedia: true,
  labels: {
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
