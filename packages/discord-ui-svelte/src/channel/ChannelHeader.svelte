<script module lang="ts">
  import type { ChannelType } from "@arcscord/discord-ui-core";
  import type { Snippet } from "svelte";

  export type ChannelHeaderProps = { name: string; channelType?: ChannelType | undefined; locked?: boolean | undefined; rules?: boolean | undefined; topic?: string | undefined; actions?: Snippet | undefined };
</script>

<script lang="ts">
  import { getChannelTypeLabel } from "@arcscord/discord-ui-core";
  import { getDisplayOptions } from "../display-context.js";
  import ChannelIcon from "./ChannelIcon.svelte";

  const display = getDisplayOptions();
  const { name, topic, actions, channelType, locked, rules }: ChannelHeaderProps = $props();
</script>

<header class="dui-channel-header">
  <ChannelIcon {channelType} {locked} {rules} />
  <h2 class="dui-channel-name">{name}</h2>
  <span class="dui-sr-only">{getChannelTypeLabel(channelType, display().labels)}</span>
  {#if topic}<p class="dui-channel-topic" title={topic}>{topic}</p>{/if}
  {#if actions}<div class="dui-channel-actions">{@render actions()}</div>{/if}
</header>
