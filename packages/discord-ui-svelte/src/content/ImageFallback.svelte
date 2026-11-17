<script lang="ts">
  import type { Snippet } from "svelte";
  import type { HTMLImgAttributes } from "svelte/elements";

  const { source, fallback, ...attributes }: Omit<HTMLImgAttributes, "src"> & {
    source: string | undefined;
    fallback: Snippet;
  } = $props();
  let failed = $state(false);
  let image: HTMLImageElement | undefined = $state();
  $effect(() => {
    if (image?.complete && image.naturalWidth === 0)
      failed = true;
  });
</script>

{#if source && !failed}
  <img {...attributes} alt={attributes.alt ?? ""} src={source} bind:this={image} onerror={() => failed = true} />
{:else}
  {@render fallback()}
{/if}
