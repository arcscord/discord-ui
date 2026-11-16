<script module lang="ts">
  import type { Snippet } from "svelte";

  export type ActionRowProps = { children: Snippet };
</script>

<script lang="ts">
  const { children }: ActionRowProps = $props();
</script>

<div class="dui-action-row">{@render children()}</div>
