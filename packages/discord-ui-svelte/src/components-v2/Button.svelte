<script module lang="ts">
  import type { Snippet } from "svelte";

  export type ButtonProps = {
    label: string;
    ariaLabel?: string | undefined;
    variant?: "primary" | "secondary" | "success" | "danger" | "premium" | undefined;
    disabled?: boolean | undefined;
    emoji?: Snippet | undefined;
    onClick?: (() => void) | undefined;
  };
</script>

<script lang="ts">
  const { label, ariaLabel, variant = "primary", disabled = false, emoji, onClick }: ButtonProps = $props();
</script>

<button type="button" aria-label={ariaLabel?.trim() || undefined} class={["dui-component-button", `dui-button-${variant}`]} {disabled} onclick={() => onClick?.()}>
  {#if emoji}<span class="dui-button-emoji" aria-hidden={Boolean(ariaLabel?.trim() || label.trim()) || undefined}>{@render emoji()}</span>{/if}
  <span class="dui-button-label">{label}</span>
</button>
