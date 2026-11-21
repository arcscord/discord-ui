<script module lang="ts">
  import type { MessageMediaView } from "@arcscord/discord-ui-core";

  export type MediaProps = { media: MessageMediaView };
</script>

<script lang="ts">
  import { mediaUrl } from "@arcscord/discord-ui-core";
  import ImageFallback from "../content/ImageFallback.svelte";
  import Spoiler from "../content/Spoiler.svelte";
  import { getDisplayOptions } from "../display-context.js";
  import Video from "./Video.svelte";

  const { media }: MediaProps = $props();
  const display = getDisplayOptions();
  const source = $derived(mediaUrl(media.url, display().allowRemoteMedia, display().remoteMediaAllowlist));
</script>

{#snippet image()}
  <figure class="dui-media">
    {#key source}
      <ImageFallback {source} alt={media.alt} width={media.width} height={media.height} loading="lazy">
        {#snippet fallback()}
          <div class="dui-media-error" role="img" aria-label={`${display().labels.mediaUnavailable}: ${media.alt}`}>{display().labels.mediaUnavailable}</div>
        {/snippet}
      </ImageFallback>
    {/key}
  </figure>
{/snippet}

{#if "kind" in media && media.kind === "video"}
  <Video video={media} />
{:else if media.spoiler}
  <div class="dui-media-spoiler">
    {#key media.id}
      <Spoiler inline={false}>
        {#snippet placeholder()}
          <div class="dui-media-placeholder" style:aspect-ratio={`${media.width || 16} / ${media.height || 9}`} style:min-height="0"></div>
        {/snippet}
        {@render image()}
      </Spoiler>
    {/key}
  </div>
{:else}
  {@render image()}
{/if}
