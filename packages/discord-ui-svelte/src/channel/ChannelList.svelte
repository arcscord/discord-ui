<script module lang="ts">
  import type { ChannelCategoryView, ChannelKind } from "@arcscord/discord-ui-core";

  export type ChannelListProps = {
    categories: readonly ChannelCategoryView[];
    /** Accessible name of the navigation landmark. */
    label?: string | undefined;
    activeChannelId?: string | undefined;
    /** Rows are buttons only when this is provided; the host owns navigation. */
    onChannelClick?: ((channelId: string) => void) | undefined;
  };

  const symbols: Record<ChannelKind, string> = {
    text: "#",
    voice: "🔊",
    announcement: "📢",
    forum: "💬",
  };
</script>

<script lang="ts">
  const { categories, label, activeChannelId, onChannelClick }: ChannelListProps = $props();
</script>

<nav class="dui-channel-list" aria-label={label}>
  {#each categories as category (category.id)}
    <div>
      {#if category.name}<h3 class="dui-channel-list-category" title={category.name}>{category.name}</h3>{/if}
      <ul>
        {#each category.channels as channel (channel.id)}
          <li>
            <svelte:element
              this={onChannelClick ? "button" : "span"}
              type={onChannelClick ? "button" : undefined}
              role={onChannelClick ? "button" : undefined}
              class="dui-channel-list-item"
              data-muted={channel.muted || undefined}
              aria-current={channel.id === activeChannelId
                ? "page"
                : undefined}
              onclick={onChannelClick
                ? () => onChannelClick(channel.id)
                : undefined}
            >
              <span class="dui-channel-list-symbol" aria-hidden="true">{symbols[channel.kind ?? "text"]}</span>
              <span class="dui-channel-list-name">{channel.name}</span>
              {#if channel.badge}<span class="dui-channel-list-badge">{channel.badge}</span>{/if}
            </svelte:element>
          </li>
        {/each}
      </ul>
    </div>
  {/each}
</nav>
