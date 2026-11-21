<script module lang="ts">
  import type { StickerView } from "@arcscord/discord-ui-core";

  export type StickerProps = { sticker: StickerView };
</script>

<script lang="ts">
  import { defaultMediaLabels, mediaUrl } from "@arcscord/discord-ui-core";
  import ImageFallback from "../content/ImageFallback.svelte";
  import { getDisplayOptions } from "../display-context.js";

  const { sticker }: StickerProps = $props();
  const display = getDisplayOptions();
  const labels = $derived({
    ...defaultMediaLabels,
    ...display().labels,
  });
  const source = $derived(mediaUrl(sticker.url, display().allowRemoteMedia, display().remoteMediaAllowlist));
</script>

<figure class="dui-sticker">
  {#if sticker.format === "lottie"}
    <div class="dui-media-error" role="status">{labels.mediaUnsupportedSticker}: {sticker.name}</div>
  {:else}
    {#key `${sticker.id}:${source ?? ""}:${sticker.format}`}
      <ImageFallback {source} alt={sticker.name} width={160} height={160} loading="lazy">
        {#snippet fallback()}<div class="dui-media-error" role="status">{display().labels.mediaUnavailable}: {sticker.name}</div>{/snippet}
      </ImageFallback>
    {/key}
  {/if}
</figure>
