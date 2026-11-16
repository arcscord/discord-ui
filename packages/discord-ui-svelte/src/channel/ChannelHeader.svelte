<script module lang="ts">
  import type { Snippet } from "svelte";

  export type ChannelHeaderProps = { name: string; topic?: string | undefined; actions?: Snippet | undefined };
</script>

<script lang="ts">
  const { name, topic, actions }: ChannelHeaderProps = $props();
</script>

<header class="dui-channel-header">
  <span class="dui-channel-symbol" aria-hidden="true">#</span>
  <h2 class="dui-channel-name">{name}</h2>
  {#if topic}<p class="dui-channel-topic" title={topic}>{topic}</p>{/if}
  {#if actions}<div class="dui-channel-actions">{@render actions()}</div>{/if}
</header>
