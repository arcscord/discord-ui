import type { ReactNode } from "react";
import { useDisplayOptions } from "../display-context";

export type MessageFrameProps = {
  avatar?: ReactNode;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function MessageFrame({ avatar, header, footer, children }: MessageFrameProps) {
  const { theme } = useDisplayOptions();
  return (
    <article className="arcscord-discord-ui dui-message" data-theme={theme}>
      <div className="dui-message-avatar">{avatar}</div>
      <div className="dui-message-main">
        {header}
        <div className="dui-message-body">{children}</div>
        {footer}
      </div>
    </article>
  );
}
