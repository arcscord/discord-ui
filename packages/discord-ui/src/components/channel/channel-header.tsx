import type { ChannelType } from "@arcscord/discord-ui-core";
import type { ReactNode } from "react";
import { getChannelTypeLabel } from "@arcscord/discord-ui-core";
import { useDisplayOptions } from "../display-context";
import { ChannelIcon } from "./channel-icon";

export type ChannelHeaderProps = {
  name: string;
  topic?: string | undefined;
  actions?: ReactNode;
  channelType?: ChannelType | undefined;
  locked?: boolean | undefined;
  rules?: boolean | undefined;
};

export function ChannelHeader({ name, topic, actions, channelType, locked, rules }: ChannelHeaderProps) {
  const { labels } = useDisplayOptions();
  return (
    <header className="dui-channel-header">
      <ChannelIcon channelType={channelType} locked={locked} rules={rules} />
      <h2 className="dui-channel-name">{name}</h2>
      <span className="dui-sr-only">{getChannelTypeLabel(channelType, labels)}</span>
      {topic
        ? <p className="dui-channel-topic" title={topic}>{topic}</p>
        : null}
      {actions
        ? <div className="dui-channel-actions">{actions}</div>
        : null}
    </header>
  );
}
