<script module lang="ts">
  import type { ThreadSummaryView } from "@arcscord/discord-ui-core";

  export type ThreadPreviewProps = {
    thread: ThreadSummaryView;
    onOpen?: ((id: string) => void) | undefined;
    active?: boolean | undefined;
  };
</script>

<script lang="ts">
  import { formatDiscordTimestamp, parseTimestamp } from "@arcscord/discord-ui-core";
  import Author from "../author/Author.svelte";
  import Avatar from "../author/Avatar.svelte";
  import { getDisplayOptions } from "../display-context.js";

  const { thread, onOpen, active = false }: ThreadPreviewProps = $props();
  const display = getDisplayOptions();
  const descriptionId = $props.id();
  const labels = $derived(display().labels);
  const count = $derived(new Intl.NumberFormat(display().locale).format(thread.messageCount));
  const singular = $derived(new Intl.PluralRules(display().locale).select(thread.messageCount) === "one");
  const countLabel = $derived((singular ? labels.threadMessageSingular : labels.threadMessagePlural).replace("{count}", count));
  const last = $derived(thread.lastMessage);
  const date = $derived(last && parseTimestamp(last.timestamp));
  const time = $derived(last && date
    ? formatDiscordTimestamp(String(date.valueOf() / 1000), "R", {
      locale: display().locale,
      timeZone: display().timeZone,
      referenceTime: display().referenceTime ?? last.timestamp,
      relativeStyle: "narrow",
    })
    : undefined);
</script>

{#snippet content()}
  <span class="dui-thread-preview-header">
    <span class="dui-thread-name" title={thread.name}>{thread.name}</span>
    <span class="dui-thread-count">{countLabel}{#if onOpen}<span aria-hidden="true">&nbsp;›</span>{/if}</span>
  </span>
  <span class="dui-thread-last" id={descriptionId}>
    {#if last}
      <Avatar author={last.author} />
      <span class="dui-thread-last-author"><Author author={last.author} /></span>
      <span class="dui-thread-snippet" title={last.content}>{last.content}</span>
      {#if time}<time class="dui-thread-last-time" datetime={time.dateTime}>{time.label}</time>{/if}
    {:else}
      <span class="dui-thread-snippet">{labels.threadNoRecentMessages}</span>
    {/if}
  </span>
{/snippet}

{#if onOpen}
  <button type="button" class="dui-thread-preview" aria-label={`${labels.openThread} ${thread.name}, ${countLabel}`} aria-describedby={descriptionId} aria-expanded={active} onclick={() => onOpen?.(thread.id)}>{@render content()}</button>
{:else}
  <div class="dui-thread-preview">{@render content()}</div>
{/if}
