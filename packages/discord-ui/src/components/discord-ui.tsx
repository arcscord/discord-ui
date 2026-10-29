import type { ReactNode } from "react";
import type { DisplayOptions, UILabels } from "./display-context";
import { defaults, DisplayContext } from "./display-context";

export type DiscordUIProps = Partial<Omit<DisplayOptions, "labels">> & { labels?: Partial<UILabels> } & { children: ReactNode; className?: string };

export function DiscordUI({ children, className = "", ...options }: DiscordUIProps) {
  const value = {
    ...defaults,
    scoped: true,
    ...options,
    labels: {
      ...defaults.labels,
      ...options.labels,
    },
  };
  return (
    <DisplayContext value={value}>
      <div className={`arcscord-discord-ui ${className}`} data-theme={value.theme}>{children}</div>
    </DisplayContext>
  );
}
