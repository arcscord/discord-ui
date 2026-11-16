<script module lang="ts">
  import type { Snippet } from "svelte";

  export type ContainerProps = { children: Snippet; accentColor?: string | undefined; spoiler?: boolean | undefined };
</script>

<script lang="ts">
  import Spoiler from "../content/Spoiler.svelte";
  import { hexColor } from "../display-context.js";

  const { children, accentColor, spoiler = false }: ContainerProps = $props();
  const color = $derived(hexColor(accentColor));
</script>

{#snippet content()}
  <div class="dui-container" class:dui-container-accented={color} style:--discord-ui-container-accent={color}>{@render children()}</div>
{/snippet}

{#if spoiler}
  <Spoiler inline={false}>{@render content()}</Spoiler>
{:else}
  {@render content()}
{/if}
