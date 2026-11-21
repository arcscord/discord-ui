<script module lang="ts">
  import type { AudioView } from "@arcscord/discord-ui-core";

  export type AudioProps = { audio: AudioView };
</script>

<script lang="ts">
  import { mediaUrl } from "@arcscord/discord-ui-core";
  import Spoiler from "../content/Spoiler.svelte";
  import { getDisplayOptions } from "../display-context.js";
  import MediaPlayer from "./MediaPlayer.svelte";

  const { audio }: AudioProps = $props();
  const display = getDisplayOptions();
  const source = $derived(mediaUrl(audio.url, display().allowRemoteMedia, display().remoteMediaAllowlist));
</script>

{#snippet player()}
  {#key `${audio.id}:${source ?? ""}`}
    <MediaPlayer media={audio} {source} />
  {/key}
{/snippet}

{#if audio.spoiler}
  <div class="dui-media-spoiler">{#key `${audio.id}:${source ?? ""}`}<Spoiler inline={false}>{@render player()}</Spoiler>{/key}</div>
{:else}
  {@render player()}
{/if}
