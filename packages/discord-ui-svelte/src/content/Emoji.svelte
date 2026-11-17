<script module lang="ts">
  export type EmojiProps = { name: string; image?: string | undefined };
</script>

<script lang="ts">
  import { mediaUrl } from "@arcscord/discord-ui-core";
  import { isUnicodeEmoji } from "@arcscord/discord-ui-core/emoji";
  import { getDisplayOptions } from "../display-context.js";
  import ImageFallback from "./ImageFallback.svelte";
  import UnicodeEmoji from "./UnicodeEmoji.svelte";

  const { name, image }: EmojiProps = $props();
  const display = getDisplayOptions();
  const source = $derived(mediaUrl(image, display().allowRemoteMedia, display().remoteMediaAllowlist));
</script>

{#if !image && isUnicodeEmoji(name)}
  <UnicodeEmoji content={name} />
{:else}
  {#key source}
    <ImageFallback {source} class="dui-emoji" alt={name
      ? `:${name}:`
      : ""} width={22} height={22}>
      {#snippet fallback()}<span class="dui-emoji-fallback">:{name}:</span>{/snippet}
    </ImageFallback>
  {/key}
{/if}
