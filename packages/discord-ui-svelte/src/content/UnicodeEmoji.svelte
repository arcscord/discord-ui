<script lang="ts">
  import { segmentUnicodeEmoji } from "@arcscord/discord-ui-core/emoji";
  import { getDisplayOptions } from "../display-context.js";
  import ImageFallback from "./ImageFallback.svelte";

  const { content }: { content: string } = $props();
  const display = getDisplayOptions();
</script>

{#if display().unicodeEmoji?.mode === "twemoji"}
  {#each segmentUnicodeEmoji(content, display()) as segment (segment.start)}
    {#if segment.kind === "emoji" && segment.source}
      {#key segment.source}
        <ImageFallback source={segment.source} class="dui-emoji dui-unicode-emoji" alt={segment.text} width={22} height={22} draggable={false}>
          {#snippet fallback()}{segment.text}{/snippet}
        </ImageFallback>
      {/key}
    {:else}{segment.text}{/if}
  {/each}
{:else}{content}{/if}
