<script module lang="ts">
  import type { Snippet } from "svelte";

  export type LinkButtonProps = { label: string; ariaLabel?: string | undefined; url: string; disabled?: boolean | undefined; emoji?: Snippet | undefined };
</script>

<script lang="ts">
  import { linkUrl } from "@arcscord/discord-ui-core";

  const { label, ariaLabel, url, disabled = false, emoji }: LinkButtonProps = $props();
  const href = $derived(disabled
    ? undefined
    : linkUrl(url));
</script>

{#snippet content()}
  {#if emoji}<span class="dui-button-emoji" aria-hidden={Boolean(ariaLabel?.trim() || label.trim()) || undefined}>{@render emoji()}</span>{/if}
  <span class="dui-button-label">{label}</span>
  <!-- External-link SVG adapted from the AutoThreads renderer; see THIRD_PARTY_NOTICES. -->
  <svg class="dui-button-external-icon" aria-hidden="true" width="16" height="16" fill="none" viewBox="0 0 24 24">
    <path fill="currentColor" d="M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z" />
    <path fill="currentColor" d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z" />
  </svg>
{/snippet}

{#if href}
  <a aria-label={ariaLabel?.trim() || undefined} class="dui-component-button dui-button-link" {href} target="_blank" rel="noopener noreferrer">{@render content()}</a>
{:else}
  <span aria-label={ariaLabel?.trim() || undefined} class="dui-component-button dui-button-link dui-component-disabled" role="link" aria-disabled="true">{@render content()}</span>
{/if}
