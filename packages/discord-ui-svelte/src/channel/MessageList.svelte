<script module lang="ts">
  import type { ComponentHandlers, MessageView, ReactionToggleHandler, SelectValuesByMessage } from "@arcscord/discord-ui-core";

  export type MessageListProps = ComponentHandlers & {
    selectValuesByMessage?: SelectValuesByMessage | undefined;
    onReactionToggle?: ReactionToggleHandler | undefined;
    onEphemeralDismiss?: ((messageId: string) => void) | undefined;
    messages: readonly MessageView[];
    showDateSeparators?: boolean | undefined;
    showThreadPreviews?: boolean | undefined;
    onThreadOpen?: ((id: string) => void) | undefined;
    activeThreadId?: string | undefined;
    availableThreadIds?: readonly string[] | undefined;
  };
</script>

<script lang="ts">
  import { parseTimestamp } from "@arcscord/discord-ui-core";
  import { getDisplayOptions } from "../display-context.js";
  import Message from "../message/Message.svelte";

  const { selectValuesByMessage, onEphemeralDismiss, onButtonClick, onSelectChange, onPremiumClick, messages, onReactionToggle, showDateSeparators = true, showThreadPreviews = true, onThreadOpen, activeThreadId, availableThreadIds }: MessageListProps = $props();
  const display = getDisplayOptions();
  const labels = $derived(display().labels);
  const dates = $derived.by(() => {
    if (!showDateSeparators)
      return [];
    const keyFormat = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone: display().timeZone,
    });
    const labelFormat = new Intl.DateTimeFormat(display().locale, { dateStyle: "long", timeZone: display().timeZone });
    let previous: string | undefined;
    return messages.map(({ timestamp }) => {
      const date = parseTimestamp(timestamp);
      const parts = date
        ? keyFormat.formatToParts(date)
        : [];
      const key = date
        ? ["year", "month", "day"].map(type => parts.find(part => part.type === type)?.value).join("-")
        : undefined;
      const separator = date && key !== previous
        ? {
          key,
          label: labelFormat.format(date),
        }
        : undefined;
      previous = key;
      return separator;
    });
  });
</script>

{#if messages.length}
  <ol class="dui-message-list" aria-label={labels.messages}>
    {#each messages as message, index (message.id)}
      {@const date = dates[index]}
      <li class="dui-message-list-item">
        {#if date}<div class="dui-date-separator"><time datetime={date.key}>{date.label}</time></div>{/if}
        <Message {onEphemeralDismiss} {onButtonClick} {onSelectChange} {onPremiumClick} {message}
                 selectValues={selectValuesByMessage && Object.hasOwn(selectValuesByMessage, message.id)
                   ? selectValuesByMessage[message.id]
                   : undefined}
                 {onReactionToggle} showThreadPreview={showThreadPreviews}
                 onThreadOpen={message.thread && (!availableThreadIds || availableThreadIds.includes(message.thread.id))
                   ? onThreadOpen
                   : undefined}
                 {activeThreadId} />
      </li>
    {/each}
  </ol>
{:else}
  <p class="dui-channel-empty">{labels.emptyChannel}</p>
{/if}
