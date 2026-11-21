<script module lang="ts">
  import type { ChannelViewModel, ComponentHandlers, ReactionToggleHandler, SelectValuesByMessage, SlashCommand, SlashCommandHandler } from "@arcscord/discord-ui-core";
  import type { Snippet } from "svelte";
  import type { MessageInteractionHandlers } from "../interactions.js";

  export type ChannelViewProps = ComponentHandlers & MessageInteractionHandlers & {
    selectValuesByMessage?: SelectValuesByMessage | undefined;
    channel: ChannelViewModel;
    onReactionToggle?: ReactionToggleHandler | undefined;
    onEphemeralDismiss?: ((messageId: string) => void) | undefined;
    height?: number | string;
    header?: Snippet;
    composer?: Snippet | false;
    onSend?: ((content: string) => void) | undefined;
    /** Omit for local navigation; null explicitly closes the controlled thread. */
    activeThreadId?: string | null | undefined;
    onThreadOpen?: ((threadId: string) => void) | undefined;
    onThreadClose?: (() => void) | undefined;
    onThreadSend?: ((threadId: string, content: string) => void) | undefined;
    commands?: readonly SlashCommand[] | undefined;
    onSlashCommand?: SlashCommandHandler | undefined;
    composerDisabled?: boolean;
    autoScroll?: boolean;
    showDateSeparators?: boolean;
  };
</script>

<script lang="ts">
  import DiscordUI from "../DiscordUI.svelte";
  import { getDisplayOptions } from "../display-context.js";
  import ChannelConversation from "./ChannelConversation.svelte";

  const props: ChannelViewProps = $props();
  const display = getDisplayOptions();
</script>

{#snippet channel()}
  {#key props.channel.id}
    <ChannelConversation {...props} />
  {/key}
{/snippet}

{#if display().scoped}
  {@render channel()}
{:else}
  <DiscordUI children={channel} />
{/if}
