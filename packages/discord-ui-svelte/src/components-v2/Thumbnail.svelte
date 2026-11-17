<script module lang="ts">
  import type { MediaView } from "@arcscord/discord-ui-core";

  export type ThumbnailProps = { media: MediaView };
</script>

<script lang="ts">
  import Media from "../media/Media.svelte";

  const { media }: ThumbnailProps = $props();
</script>

<div class="dui-thumbnail"><Media {media} /></div>
