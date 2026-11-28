// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { ChannelType } from "@arcscord/discord-ui-core";
import type { VNodeChild } from "vue";
import { getChannelTypeLabel } from "@arcscord/discord-ui-core";
import { defineRenderer } from "../../rendering";
import { ChannelIcon } from "./channel-icon";

type ChannelHeaderPropsInput = {
  name: string;
  channelType?: ChannelType | undefined;
  locked?: boolean | undefined;
  rules?: boolean | undefined;
  topic?: string | undefined;
  actions?: VNodeChild;
};
export type ChannelHeaderProps = Omit<ChannelHeaderPropsInput, "actions">;
export type ChannelHeaderSlots = { actions?: () => VNodeChild };
export const ChannelHeader = defineRenderer<ChannelHeaderProps, ChannelHeaderPropsInput, ChannelHeaderSlots>("ChannelHeader", [
  "name",
  "topic",
  "channelType",
  "locked",
  "rules",
], ["actions"], (input, display) => {
  return () => {
    const { name, topic, actions, channelType, locked, rules } = input(true);

    return (
      <header class="dui-channel-header">
        <ChannelIcon channel={{ channelType, locked, rules }} />
        <h2 class="dui-channel-name">{name}</h2>
        <span class="dui-sr-only">{getChannelTypeLabel(channelType, display.labels)}</span>
        {topic
          ? <p class="dui-channel-topic" title={topic}>{topic}</p>
          : null}
        {actions
          ? <div class="dui-channel-actions">{actions}</div>
          : null}
      </header>
    );
  };
});
export type ChannelHeaderEmits = Record<string, never>;
