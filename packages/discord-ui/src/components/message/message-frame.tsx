import type { MouseEventHandler, ReactNode } from "react";
import { themeStyle } from "../../themes";
import { useDisplayOptions } from "../display-context";
import { contextMenuKey } from "../interaction-context";

export type MessageFrameProps = {
  onContextMenu?: MouseEventHandler<HTMLElement> | undefined;
  hasThread?: boolean;
  ephemeral?: boolean;
  mentioned?: boolean;
  reply?: ReactNode;
  avatar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function MessageFrame({ onContextMenu, avatar, reply, header, footer, children, ephemeral = false, mentioned = false, hasThread = false }: MessageFrameProps) {
  const { resolvedTheme, scoped, labels } = useDisplayOptions();
  return (
    <article
      onKeyDown={onContextMenu ? contextMenuKey : undefined}
      onContextMenu={onContextMenu}
      tabIndex={onContextMenu ? 0 : undefined}
      className={`${scoped ? "" : "arcscord-discord-ui "}dui-message`}
      data-ephemeral={ephemeral || undefined}
      data-mentioned={mentioned || undefined}
      aria-label={mentioned ? labels.mentionedMessage : undefined}
      data-has-thread={hasThread || undefined}
      data-theme={resolvedTheme.name}
      data-base-theme={scoped ? undefined : resolvedTheme.base}
      data-color-scheme={resolvedTheme.colorScheme}
      style={scoped
        ? undefined
        : themeStyle(resolvedTheme.tokens)}
    >
      {reply
        ? <div className="dui-message-reply">{reply}</div>
        : null}
      <div className="dui-message-avatar">{avatar}</div>
      <div className="dui-message-main">
        {header}
        <div className="dui-message-body">{children}</div>
        {footer}
      </div>
    </article>
  );
}
