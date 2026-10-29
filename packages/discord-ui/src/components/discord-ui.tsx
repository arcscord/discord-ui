import type { ReactNode } from "react";
import type { DisplayOptions, UILabels } from "./display-context";
import { resolveTheme, themeStyle } from "../themes";
import { defaults, DisplayContext } from "./display-context";

export type DiscordUIProps = Partial<Omit<DisplayOptions, "labels">> & { labels?: Partial<UILabels> } & { children: ReactNode; className?: string };

export function DiscordUI({ children, className = "", ...options }: DiscordUIProps) {
  const resolvedTheme = resolveTheme(options.theme ?? defaults.theme, options.tokens);
  const value = {
    ...defaults,
    scoped: true,
    ...options,
    resolvedTheme,
    labels: {
      ...defaults.labels,
      ...options.labels,
    },
  };
  return (
    <DisplayContext value={value}>
      <div className={`arcscord-discord-ui ${className}`} data-theme={resolvedTheme.name} data-base-theme={resolvedTheme.base} data-color-scheme={resolvedTheme.colorScheme} style={themeStyle(resolvedTheme.tokens)}>{children}</div>
    </DisplayContext>
  );
}
