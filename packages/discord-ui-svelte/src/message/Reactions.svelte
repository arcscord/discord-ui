<script module lang="ts">
  import type { ReactionView } from "@arcscord/discord-ui-core";

  export type ReactionsProps = {
    reactions: readonly ReactionView[];
    onToggle?: ((reactionId: string) => void) | undefined;
  };
</script>

<script lang="ts">
  import Emoji from "../content/Emoji.svelte";
  import { getDisplayOptions } from "../display-context.js";

  const { reactions, onToggle }: ReactionsProps = $props();
  const display = getDisplayOptions();
  const visible = $derived(reactions.filter(reaction => Number.isSafeInteger(reaction.count) && reaction.count > 0));
  const format = $derived(new Intl.NumberFormat(display().locale));
</script>

{#if visible.length}
  <div class="dui-reactions" role="group" aria-label={display().labels.reactions}>
    {#each visible as reaction (reaction.id)}
      {@const count = format.format(reaction.count)}
      {@const label = `${reaction.emoji.name}: ${count}`}
      {#snippet content()}
        <Emoji name={reaction.emoji.name} image={reaction.emoji.image} /><span>{count}</span>
      {/snippet}
      {#if onToggle}
        <button type="button" class="dui-reaction" aria-label={label} aria-pressed={Boolean(reaction.me)} onclick={() => onToggle?.(reaction.id)}>{@render content()}</button>
      {:else}
        <span class="dui-reaction" data-selected={reaction.me || undefined} aria-label={label}>{@render content()}</span>
      {/if}
    {/each}
  </div>
{/if}
