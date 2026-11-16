<script module lang="ts">
  import type { Snippet } from "svelte";

  /** Text keeps its natural size under the mask; media mounts on reveal. */
  export type SpoilerProps = { children: Snippet; inline?: boolean; placeholder?: Snippet };
</script>

<script lang="ts">
  import { getDisplayOptions } from "../display-context.js";

  const { children, inline = true, placeholder }: SpoilerProps = $props();
  let revealed = $state(false);
  const display = getDisplayOptions();
  const tag = $derived(inline ? "span" : "div");
</script>

<svelte:element this={tag} class={inline ? "dui-revealable-text" : "dui-revealable-media"} data-revealed={revealed}>
  <svelte:element this={tag} class="dui-spoiler-content" aria-hidden={!revealed} inert={!revealed}>
    {#if inline || revealed}
      {@render children()}
    {:else if placeholder}
      {@render placeholder()}
    {:else}
      <div class="dui-media-placeholder"></div>
    {/if}
  </svelte:element>
  <button type="button" class={revealed ? "dui-spoiler-close" : "dui-spoiler-toggle"} aria-expanded={revealed} aria-label={revealed
    ? display().labels.hideSpoiler
    : display().labels.showSpoiler} onclick={() => revealed = !revealed}>
    {#if revealed}×{:else if !inline}<span class="dui-spoiler-badge" aria-hidden="true">{display().labels.spoiler}</span>{/if}
  </button>
</svelte:element>
