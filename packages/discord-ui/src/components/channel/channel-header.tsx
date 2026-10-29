import type { ReactNode } from "react";

export type ChannelHeaderProps = { name: string; topic?: string | undefined; actions?: ReactNode };

export function ChannelHeader({ name, topic, actions }: ChannelHeaderProps) {
  return (
    <header className="dui-channel-header">
      <span className="dui-channel-symbol" aria-hidden="true">#</span>
      <h2 className="dui-channel-name">{name}</h2>
      {topic
        ? <p className="dui-channel-topic" title={topic}>{topic}</p>
        : null}
      {actions
        ? <div className="dui-channel-actions">{actions}</div>
        : null}
    </header>
  );
}
