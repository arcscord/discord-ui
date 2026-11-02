import type { ThemeName } from "@arcscord/discord-ui";

export function playgroundUrl(id: string, theme?: ThemeName): string {
  return `/playground?example=${encodeURIComponent(id)}${theme
    ? `&theme=${theme}`
    : ""}`;
}
