<script module lang="ts">
  import type { ReplyView } from "@arcscord/discord-ui-core";
  import type { UserInteractionHandlers } from "../interactions.js";

  /** Renders host-supplied message or interaction context. */
  export type ReplyPreviewProps = UserInteractionHandlers & { reply: ReplyView };
</script>

<script lang="ts">
  import Author from "../author/Author.svelte";
  import Avatar from "../author/Avatar.svelte";
  import Mention from "../content/Mention.svelte";
  import { getDisplayOptions } from "../display-context.js";

  const { onUserClick, onUserContextMenu, reply }: ReplyPreviewProps = $props();
  const display = getDisplayOptions();
</script>

<div class="dui-reply-preview" aria-label={reply.kind === "interaction"
  ? display().labels.interactionReply
  : display().labels.reply}>
  <span class="dui-reply-connector" aria-hidden="true"></span>
  {#if reply.kind === "interaction"}
    <Avatar tabIndex={-1} {onUserClick} {onUserContextMenu} author={reply.author} />
    <Author {onUserClick} {onUserContextMenu} author={reply.author} />
    <span class="dui-interaction-used">{display().labels.interactionUsed}</span>
    <span class="dui-interaction-command"><Mention kind="command" name={reply.commandName} /></span>
  {:else if reply.unavailable}
    <span class="dui-reply-content">{display().labels.replyUnavailable}</span>
  {:else}
    <Avatar tabIndex={-1} {onUserClick} {onUserContextMenu} author={reply.author} />
    <Author {onUserClick} {onUserContextMenu} author={reply.author} />
    <span class="dui-reply-content">{reply.content}</span>
  {/if}
</div>
