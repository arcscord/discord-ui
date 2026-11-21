<script lang="ts">
  import { DiscordUI, MessageFrame } from "../src/index.js";

  const { mentioned = false, label }: { mentioned?: boolean; label?: string } = $props();
</script>

{#if label}
  <DiscordUI labels={{ mentionedMessage: label }}>
    <MessageFrame {mentioned}><p>Standalone mentioned frame</p></MessageFrame>
  </DiscordUI>
{:else}
  <MessageFrame {mentioned}><p>Standalone mentioned frame</p></MessageFrame>
{/if}
