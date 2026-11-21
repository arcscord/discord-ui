<script module lang="ts">
  import type { VideoView } from "@arcscord/discord-ui-core";

  export type VideoProps = { video: VideoView };
</script>

<script lang="ts">
  import { mediaUrl } from "@arcscord/discord-ui-core";
  import Spoiler from "../content/Spoiler.svelte";
  import { getDisplayOptions } from "../display-context.js";
  import MediaPlayer from "./MediaPlayer.svelte";

  const { video }: VideoProps = $props();
  const display = getDisplayOptions();
  const source = $derived(mediaUrl(video.url, display().allowRemoteMedia, display().remoteMediaAllowlist));
  const poster = $derived(mediaUrl(video.posterUrl, display().allowRemoteMedia, display().remoteMediaAllowlist));
</script>

{#snippet player()}
  {#key `${video.id}:${source ?? ""}`}
    <MediaPlayer media={video} {source} {poster} />
  {/key}
{/snippet}

{#if video.spoiler}
  <div class="dui-media-spoiler">
    {#key `${video.id}:${source ?? ""}`}
      <Spoiler inline={false}>
        {#snippet placeholder()}<div class="dui-media-placeholder" style:aspect-ratio={`${video.width || 16} / ${video.height || 9}`} style:min-height="0"></div>{/snippet}
        {@render player()}
      </Spoiler>
    {/key}
  </div>
{:else}
  {@render player()}
{/if}
