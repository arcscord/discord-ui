// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { VNodeChild } from "vue";
import { defineRenderer } from "../../rendering";

type ChannelHeaderPropsInput = {
  name: string;
  topic?: string | undefined;
  actions?: VNodeChild;
};
export type ChannelHeaderProps = Omit<ChannelHeaderPropsInput, "actions">;
export type ChannelHeaderSlots = { actions?: () => VNodeChild };
export const ChannelHeader = defineRenderer<ChannelHeaderProps, ChannelHeaderPropsInput, ChannelHeaderSlots>("ChannelHeader", ["name", "topic"], ["actions"], (input, _display) => {
  return () => {
    const { name, topic, actions } = input(true);

    return (
      <header class="dui-channel-header">
        <span class="dui-channel-symbol" aria-hidden="true">#</span>
        <h2 class="dui-channel-name">{name}</h2>
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
