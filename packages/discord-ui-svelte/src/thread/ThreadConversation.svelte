<script lang="ts">
  import type { ThreadPanelProps } from "./ThreadPanel.svelte";
  import ChannelComposer from "../channel/ChannelComposer.svelte";
  import ChannelHeader from "../channel/ChannelHeader.svelte";
  import { trackMessageScroll } from "../channel/message-scroll.svelte.js";
  import MessageList from "../channel/MessageList.svelte";
  import { getDisplayOptions } from "../display-context.js";

  const { selectValuesByMessage, onEphemeralDismiss, onButtonClick, onSelectChange, onPremiumClick, thread, onReactionToggle, parentMessage, onClose, onSend, composerDisabled = false, autoScroll = true }: ThreadPanelProps = $props();
  const display = getDisplayOptions();
  const label = $derived(`${display().labels.thread} : ${thread.name}`);
  let draft = $state("");
  let close = $state<HTMLButtonElement>();
  let history = $state<HTMLDivElement>();
  const messages = $derived(parentMessage
    ? [parentMessage, ...thread.messages]
    : thread.messages);
  const scroll = trackMessageScroll(() => history, () => messages.at(-1)?.id, () => autoScroll);

  $effect(() => {
    close?.focus();
  });

  function closeKey(event: KeyboardEvent): void {
    if (event.key === "Escape" && !event.defaultPrevented && !event.isComposing && onClose) {
      event.preventDefault();
      onClose();
    }
  }

  function send(content: string): void {
    onSend?.(content);
    draft = "";
  }
</script>

{#snippet actions()}
  <button type="button" class="dui-thread-close" bind:this={close} onclick={() => onClose?.()} aria-label={display().labels.closeThread}>
    <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none">
      <path d="m6 6 12 12M6 18 18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
    </svg>
  </button>
{/snippet}

<!-- svelte-ignore a11y_no_noninteractive_element_interactions (Escape closes the thread when focus is inside it.) -->
<aside class="dui-thread-panel" aria-label={label} onkeydown={closeKey}>
  <ChannelHeader name={thread.name} actions={onClose ? actions : undefined} />
  <!-- svelte-ignore a11y_no_noninteractive_tabindex (Make the scrolling history independently keyboard-scrollable.) -->
  <div class="dui-channel-history" role="log" aria-label={label} aria-live="polite" tabindex="0" bind:this={history} onscroll={scroll}>
    <MessageList {selectValuesByMessage} {onEphemeralDismiss} {onButtonClick} {onSelectChange} {onPremiumClick} {onReactionToggle}
                 {messages} showThreadPreviews={false} />
  </div>
  <ChannelComposer channelName={thread.name} value={draft} onValueChange={value => draft = value} onSend={onSend ? send : undefined} disabled={composerDisabled} />
</aside>
