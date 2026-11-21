<script module lang="ts">
  import type { ComponentHandlers, MessageView, ReactionToggleHandler, SelectValues } from "@arcscord/discord-ui-core";

  export type MessageProps = ComponentHandlers & {
    onReactionToggle?: ReactionToggleHandler | undefined;
    message: MessageView;
    selectValues?: SelectValues | undefined;
    onEphemeralDismiss?: ((messageId: string) => void) | undefined;
    onThreadOpen?: ((id: string) => void) | undefined;
    activeThreadId?: string | undefined;
    showThreadPreview?: boolean | undefined;
  };
</script>

<script lang="ts">
  import Avatar from "../author/Avatar.svelte";
  import File from "../components-v2/File.svelte";
  import MessageComponents from "../components-v2/MessageComponents.svelte";
  import Markdown from "../content/Markdown.svelte";
  import { getDisplayOptions } from "../display-context.js";
  import Embed from "../embed/Embed.svelte";
  import Audio from "../media/Audio.svelte";
  import MediaGallery from "../media/MediaGallery.svelte";
  import Sticker from "../media/Sticker.svelte";
  import ThreadPreview from "../thread/ThreadPreview.svelte";
  import MessageContent from "./MessageContent.svelte";
  import MessageFrame from "./MessageFrame.svelte";
  import MessageHeader from "./MessageHeader.svelte";
  import Reactions from "./Reactions.svelte";
  import ReplyPreview from "./ReplyPreview.svelte";

  const { message, selectValues, onEphemeralDismiss, onReactionToggle, onThreadOpen, activeThreadId, showThreadPreview = true, onButtonClick, onSelectChange, onPremiumClick }: MessageProps = $props();
  const display = getDisplayOptions();
  const referenceTime = $derived(display().referenceTime ?? message.timestamp);
  const labels = $derived(display().labels);
</script>

{#snippet replyPreview()}{#if message.reply}<ReplyPreview reply={message.reply} />{/if}{/snippet}

<MessageFrame ephemeral={message.ephemeral === true} hasThread={showThreadPreview && Boolean(message.thread)} reply={message.reply ? replyPreview : undefined}>
  {#snippet avatar()}<Avatar author={message.author} />{/snippet}
  {#snippet header()}<MessageHeader author={message.author} timestamp={message.timestamp} edited={message.edited} />{/snippet}
  {#snippet footer()}
    {#if showThreadPreview && message.thread}
      <ThreadPreview thread={message.thread} onOpen={onThreadOpen} active={activeThreadId === message.thread.id} />
    {/if}
    {#if message.ephemeral}
      <div class="dui-ephemeral-notice">
        <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
          <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="2" />
          <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
          <path d="m4 21 16-18" stroke="currentColor" stroke-width="2" />
        </svg>
        <span>{labels.ephemeralNotice}</span>
        {#if onEphemeralDismiss}
          <span aria-hidden="true">·</span>
          <button type="button" class="dui-ephemeral-dismiss" onclick={() => onEphemeralDismiss?.(message.id)}>{labels.dismissMessage}</button>
        {/if}
      </div>
    {/if}
  {/snippet}
  {#if message.body.kind === "components-v2"}
    <MessageComponents messageId={message.id} {selectValues} components={message.body.components} {referenceTime} {onButtonClick} {onSelectChange} {onPremiumClick} />
  {:else if message.body.kind === "markdown"}
    <Markdown content={message.body.content} {referenceTime} />
  {:else}
    <MessageContent content={message.body.content} />
  {/if}
  {#if message.media?.length}<MediaGallery items={message.media} />{/if}
  {#each message.attachments ?? [] as file (file.id)}
    {#if file.kind === "audio"}<Audio audio={file} />{:else}<File {file} />{/if}
  {/each}
  {#each message.stickers ?? [] as sticker (sticker.id)}<Sticker {sticker} />{/each}
  {#each message.embeds ?? [] as embed (embed.id)}<Embed {embed} {referenceTime} />{/each}
  {#if message.components?.length}
    <MessageComponents messageId={message.id} {selectValues} components={message.components} {referenceTime} {onButtonClick} {onSelectChange} {onPremiumClick} />
  {/if}
  {#if message.reactions?.length}
    <Reactions reactions={message.reactions} onToggle={onReactionToggle
      ? id => onReactionToggle?.(message.id, id)
      : undefined} />
  {/if}
</MessageFrame>
