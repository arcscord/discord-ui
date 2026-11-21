<script lang="ts">
  import type { ChannelViewProps } from "./ChannelView.svelte";
  import { getDisplayOptions } from "../display-context.js";
  import ThreadPanel from "../thread/ThreadPanel.svelte";
  import ChannelComposer from "./ChannelComposer.svelte";
  import ChannelHeader from "./ChannelHeader.svelte";
  import { trackMessageScroll } from "./message-scroll.svelte.js";
  import MessageList from "./MessageList.svelte";

  const { onUserClick, onUserContextMenu, onMentionClick, onMentionContextMenu, onMessageContextMenu, selectValuesByMessage, onEphemeralDismiss, onButtonClick, onSelectChange, onPremiumClick, channel, activeThreadId, onThreadOpen, onThreadClose, onReactionToggle, height = 560, header, composer, onSend, onThreadSend, commands, onSlashCommand, composerDisabled = false, autoScroll = true, showDateSeparators = true }: ChannelViewProps = $props();
  const display = getDisplayOptions();
  let draft = $state("");
  let selected = $state<string>();
  let history = $state<HTMLDivElement>();
  let opener: HTMLElement | undefined;
  let restoreFocus = false;
  const scroll = trackMessageScroll(() => history, () => channel.messages.at(-1)?.id, () => autoScroll);
  const availableThreads = $derived(channel.threads?.filter(thread => channel.messages.some(message => message.id === thread.parentMessageId && message.thread?.id === thread.id)) ?? []);
  const selection = $derived(activeThreadId !== undefined
    ? activeThreadId
    : selected);
  const opened = $derived(availableThreads.find(thread => thread.id === selection));

  $effect(() => {
    if (!opened && restoreFocus) {
      restoreFocus = false;
      (opener?.isConnected ? opener : history)?.focus();
    }
  });

  function closeThread(): void {
    restoreFocus = true;
    if (activeThreadId === undefined)
      selected = undefined;
    onThreadClose?.();
  }

  function openThread(id: string): void {
    opener = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : undefined;
    if (activeThreadId === undefined)
      selected = id;
    onThreadOpen?.(id);
  }

  function send(content: string): void {
    onSend?.(content);
    draft = "";
  }
</script>

<section class="dui-channel" style:height={typeof height === "number"
  ? `${height}px`
  : height} aria-label={`#${channel.name}`}>
  <div class="dui-channel-layout" class:dui-has-thread={opened}>
    <div class="dui-channel-main">
      {#if header}{@render header()}{:else}<ChannelHeader name={channel.name} topic={channel.topic} />{/if}
      <!-- svelte-ignore a11y_no_noninteractive_tabindex (Make the scrolling history independently keyboard-scrollable.) -->
      <div class="dui-channel-history" bind:this={history} role="log" aria-label={display().labels.messages} aria-live="polite" tabindex="0" onscroll={scroll}>
        <MessageList {onUserClick} {onUserContextMenu} {onMentionClick} {onMentionContextMenu} {onMessageContextMenu} {selectValuesByMessage} {onEphemeralDismiss} {onButtonClick} {onSelectChange} {onPremiumClick} {onReactionToggle}
                     messages={channel.messages} {showDateSeparators} onThreadOpen={openThread} activeThreadId={opened?.id}
                     availableThreadIds={availableThreads.map(thread => thread.id)} />
      </div>
      {#if composer !== false}
        {#if composer}
          {@render composer()}
        {:else}
          <ChannelComposer {commands} {onSlashCommand} channelName={channel.name} value={draft} onValueChange={value => draft = value}
                           onSend={onSend ? send : undefined} disabled={composerDisabled} />
        {/if}
      {/if}
    </div>
    {#if opened}
      {@const thread = opened}
      <ThreadPanel {onUserClick} {onUserContextMenu} {onMentionClick} {onMentionContextMenu} {onMessageContextMenu} {selectValuesByMessage} {onEphemeralDismiss} {onButtonClick} {onSelectChange} {onPremiumClick} {thread} {onReactionToggle}
                   parentMessage={channel.messages.find(message => message.id === thread.parentMessageId)}
                   onClose={closeThread} onSend={onThreadSend
                     ? content => onThreadSend?.(thread.id, content)
                     : undefined} {composerDisabled} {autoScroll} />
    {/if}
  </div>
</section>
