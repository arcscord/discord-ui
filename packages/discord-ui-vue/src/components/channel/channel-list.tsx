// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { ChannelCategoryView, ChannelKind } from "@arcscord/discord-ui-core";
import { defineRenderer } from "../../rendering";

const symbols: Record<ChannelKind, string> = {
  text: "#",
  voice: "🔊",
  announcement: "📢",
  forum: "💬",
};

export type ChannelListProps = {
  categories: readonly ChannelCategoryView[];
  /** Accessible name of the navigation landmark. */
  label?: string | undefined;
  activeChannelId?: string | undefined;
  /** Rows are buttons only when this is listened to; the host owns navigation. */
  onChannelClick?: ((channelId: string) => void) | undefined;
};
export type ChannelListSlots = Record<string, never>;
export type ChannelListEmits = import("../../public-component").EventsFromProps<ChannelListProps>;
export const ChannelList = defineRenderer<ChannelListProps, ChannelListProps, ChannelListSlots>("ChannelList", [
  "categories",
  "label",
  "activeChannelId",
  "onChannelClick",
], [], (input, _display) => {
  return () => {
    const { categories, label, activeChannelId, onChannelClick } = input();

    return (
      <nav class="dui-channel-list" aria-label={label}>
        {categories.map(category => (
          <div key={category.id}>
            {category.name
              ? <h3 class="dui-channel-list-category" title={category.name}>{category.name}</h3>
              : null}
            <ul>
              {category.channels.map((channel) => {
                const content = [
                  <span class="dui-channel-list-symbol" aria-hidden="true">{symbols[channel.kind ?? "text"]}</span>,
                  <span class="dui-channel-list-name">{channel.name}</span>,
                  channel.badge
                    ? <span class="dui-channel-list-badge">{channel.badge}</span>
                    : null,
                ];
                const row = {
                  "class": "dui-channel-list-item",
                  "data-muted": channel.muted || undefined,
                  "aria-current": channel.id === activeChannelId
                    ? "page" as const
                    : undefined,
                };
                return (
                  <li key={channel.id}>
                    {onChannelClick
                      ? <button type="button" {...row} onClick={() => onChannelClick(channel.id)}>{content}</button>
                      : <span {...row}>{content}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>
    );
  };
});
