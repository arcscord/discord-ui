import type { ChannelCategoryView, ChannelKind } from "@arcscord/discord-ui-core";

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
  /** Rows are buttons only when this is provided; the host owns navigation. */
  onChannelClick?: ((channelId: string) => void) | undefined;
};

export function ChannelList({ categories, label, activeChannelId, onChannelClick }: ChannelListProps) {
  return (
    <nav className="dui-channel-list" aria-label={label}>
      {categories.map(category => (
        <div key={category.id}>
          {category.name
            ? <h3 className="dui-channel-list-category" title={category.name}>{category.name}</h3>
            : null}
          <ul>
            {category.channels.map((channel) => {
              const content = (
                <>
                  <span className="dui-channel-list-symbol" aria-hidden="true">{symbols[channel.kind ?? "text"]}</span>
                  <span className="dui-channel-list-name">{channel.name}</span>
                  {channel.badge
                    ? <span className="dui-channel-list-badge">{channel.badge}</span>
                    : null}
                </>
              );
              const row = {
                "className": "dui-channel-list-item",
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
}
