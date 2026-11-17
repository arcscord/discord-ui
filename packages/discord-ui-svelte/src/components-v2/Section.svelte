<script module lang="ts">
  import type { Snippet } from "svelte";

  export type SectionProps = { children: Snippet; accessory: Snippet };
</script>

<script lang="ts">
  const { children, accessory }: SectionProps = $props();
</script>

<div class="dui-section">
  <div class="dui-section-content">{@render children()}</div>
  <div class="dui-section-accessory">{@render accessory()}</div>
</div>
