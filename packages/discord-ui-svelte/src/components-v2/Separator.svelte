<script module lang="ts">
  export type SeparatorProps = { divider?: boolean | undefined; spacing?: "small" | "large" | undefined };
</script>

<script lang="ts">
  const { divider = true, spacing = "small" }: SeparatorProps = $props();
</script>

<div role={divider ? "separator" : undefined} aria-hidden={!divider || undefined} class={["dui-separator", `dui-separator-${spacing}`, divider && "dui-separator-divider"]}></div>
