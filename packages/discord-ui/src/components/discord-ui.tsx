import type { ReactNode } from "react";
import type { DisplayOptions } from "./display-context";
import { defaults, DisplayContext } from "./display-context";

export type DiscordUIProps = Partial<DisplayOptions> & { children: ReactNode; className?: string };

export function DiscordUI({ children, className = "", ...options }: DiscordUIProps) {
  const value = {
    ...defaults,
    ...options,
  };
  return (
    <DisplayContext value={value}>
      <div className={`arcscord-discord-ui ${className}`} data-theme={value.theme}>{children}</div>
    </DisplayContext>
  );
}
