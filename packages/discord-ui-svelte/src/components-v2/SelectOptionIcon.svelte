<script lang="ts">
  import type { ResolvedSelectOption } from "@arcscord/discord-ui-core";
  import { mediaUrl } from "@arcscord/discord-ui-core";
  import ChannelIcon from "../channel/ChannelIcon.svelte";
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
  <ChannelIcon channelType={option.channelType} rules={option.rules} locked={option.locked} />
{:else if option.entityType === "role"}
  {@const color = hexColor(option.color)}
  {#if color}<span class="dui-select-role-dot" style:background={color} aria-hidden="true"></span>{/if}
{:else if option.emoji}
  <span class="dui-select-emoji"><Emoji name={option.emoji.name} image={option.emoji.image} /></span>
{/if}
