<script module lang="ts">
  import type { ChannelSelectOptionView, ResolvedSelectOption } from "@arcscord/discord-ui-core";

  function channelPath(option: ChannelSelectOptionView): string {
    if (option.rules)
      return "M5 3h14v16H5V3Zm-3 4v15h17M8 10l3 3 5-6";
    switch (option.channelType) {
      case 1:
      case 3: return "M4 4h16v12H9l-5 4V4Z";
      case 2:
      case 13: return "m3 9 5 0 5-5v16l-5-5H3V9Zm13-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14";
      case 5: return "M3 9h4l12-5v16L7 15H3V9Zm4 6 2 6h4l-2-6";
      case 4: return "m4 9 8 7 8-7";
      case 10:
      case 11:
      case 12: return "M6 3 3 17M13 3l-3 14M1 7h16M0 13h11M13 13h9v6h-4l-3 3v-3h-2v-6Z";
      case 14:
      case 15: return "M3 4h18v13H10l-5 4v-4H3V4Zm4 5h10M7 13h7";
      case 16: return "M3 4h18v16H3V4Zm0 13 6-6 4 4 3-3 5 5M15 8h2";
      default: return "M10 3 6 21M18 3l-4 18M3 9h18M1 15h18";
    }
  }
</script>

<script lang="ts">
  import { mediaUrl } from "@arcscord/discord-ui-core";
  import Emoji from "../content/Emoji.svelte";
  import ImageFallback from "../content/ImageFallback.svelte";
  import { getDisplayOptions, hexColor } from "../display-context.js";

  const { option, chip = false }: { option: ResolvedSelectOption; chip?: boolean } = $props();
  const display = getDisplayOptions();
  const labels = $derived(display().labels);
  const statuses = $derived({
    online: labels.userOnline,
    idle: labels.userIdle,
    dnd: labels.userDnd,
    offline: labels.userOffline,
  });
</script>

{#if option.entityType === "user"}
  {@const source = mediaUrl(option.avatarUrl, display().allowRemoteMedia, display().remoteMediaAllowlist)}
  <span class="dui-select-avatar">
    {#key source}
      <ImageFallback {source} alt="">
        {#snippet fallback()}<span aria-hidden="true">{Array.from(option.label)[0]}</span>{/snippet}
      </ImageFallback>
    {/key}
    {#if option.status && !chip}
      <span class={`dui-select-status dui-select-status-${option.status}`} aria-label={statuses[option.status] ?? option.status}></span>
    {/if}
  </span>
{:else if option.entityType === "channel"}
  <span class="dui-select-channel-icon">
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none"><path d={channelPath(option)} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
    {#if option.locked}
      <svg class="dui-select-channel-lock" aria-hidden="true" viewBox="0 0 12 14"><path d="M3 6V4a3 3 0 0 1 6 0v2M2 6h8v7H2Z" fill="var(--discord-ui-select-menu-background)" stroke="currentColor" stroke-width="1.5" /></svg>
    {/if}
  </span>
{:else if option.entityType === "role"}
  {@const color = hexColor(option.color)}
  {#if color}<span class="dui-select-role-dot" style:background={color} aria-hidden="true"></span>{/if}
{:else if option.emoji}
  <span class="dui-select-emoji"><Emoji name={option.emoji.name} image={option.emoji.image} /></span>
{/if}
