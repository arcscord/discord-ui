<script module lang="ts">
  export type HighlightedCodeProps = { content: string; language: string };
</script>

<script lang="ts">
  // Optional highlighter adapted from AutoThreads; see THIRD_PARTY_NOTICES.
  import type { HighlightToken } from "@arcscord/discord-ui-core/highlight";
  import { highlightCode } from "@arcscord/discord-ui-core/highlight";

  const { content, language }: HighlightedCodeProps = $props();
  const result = $derived(highlightCode(content, language));
</script>

{#snippet tokens(items: readonly HighlightToken[])}
  {#each items as token (token)}{#if token.type === "text"}{token.value}{:else}<span class={token.classes.join(" ")}>{@render tokens(token.children)}</span>{/if}{/each}
{/snippet}

{#if result.language}
  <code class={`language-${result.language}`}>{@render tokens(result.tokens)}</code>
{:else}
  <code>{content}</code>
{/if}
