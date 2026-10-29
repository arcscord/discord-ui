import { createContext, use } from "react";

export type DisplayOptions = {
  theme: "dark" | "light";
  locale: string;
  timeZone: string;
};

export const defaults: DisplayOptions = { theme: "dark", locale: "en-US", timeZone: "UTC" };
export const DisplayContext = createContext(defaults);

export function useDisplayOptions(): DisplayOptions {
  return use(DisplayContext);
}
