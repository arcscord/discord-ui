import type { ReactNode } from "react";
import { themeStyle } from "../../themes";
import { useDisplayOptions } from "../display-context";

export type MessageFrameProps = {
  hasThread?: boolean;
  avatar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function MessageFrame({ avatar, header, footer, children, hasThread = false }: MessageFrameProps) {
  const { resolvedTheme, scoped } = useDisplayOptions();
  return (
    <article
      className={`${scoped ? "" : "arcscord-discord-ui "}dui-message`}
      data-has-thread={hasThread || undefined}
      data-theme={resolvedTheme.name}
      data-base-theme={scoped ? undefined : resolvedTheme.base}
      data-color-scheme={resolvedTheme.colorScheme}
      style={scoped
        ? undefined
        : themeStyle(resolvedTheme.tokens)}
    >
      <div className="dui-message-avatar">{avatar}</div>
      <div className="dui-message-main">
        {header}
        <div className="dui-message-body">{children}</div>
        {footer}
      </div>
    </article>
  );
}
