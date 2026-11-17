<script module lang="ts">
  import type { ComponentHandlers, MessageView, ReactionToggleHandler, SelectValuesByMessage, ThreadView } from "@arcscord/discord-ui-core";

  export type ThreadPanelProps = ComponentHandlers & {
    selectValuesByMessage?: SelectValuesByMessage | undefined;
    thread: ThreadView;
    onReactionToggle?: ReactionToggleHandler | undefined;
    onEphemeralDismiss?: ((messageId: string) => void) | undefined;
    parentMessage?: MessageView | undefined;
    onClose?: (() => void) | undefined;
    onSend?: ((content: string) => void) | undefined;
    composerDisabled?: boolean | undefined;
    autoScroll?: boolean | undefined;
  };
</script>

<script lang="ts">
  import ThreadConversation from "./ThreadConversation.svelte";

  const props: ThreadPanelProps = $props();
</script>

{#key props.thread.id}
  <ThreadConversation {...props} />
{/key}
