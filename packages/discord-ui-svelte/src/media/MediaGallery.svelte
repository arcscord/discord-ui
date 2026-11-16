<script module lang="ts">
  import type { MediaView } from "@arcscord/discord-ui-core";

  export type MediaGalleryProps = { items: readonly MediaView[] };
</script>

<script lang="ts">
  import Media from "./Media.svelte";

  const { items }: MediaGalleryProps = $props();
</script>

<div class={[
  "dui-media-gallery",
  items.length === 1
    ? "dui-media-gallery-single"
    : "dui-media-gallery-multiple",
]}>
  {#each items as media (media.id)}
    <div class="dui-media-gallery-item"><Media {media} /></div>
  {/each}
</div>
