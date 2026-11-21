<script module lang="ts">
  import type { MessageAuthor } from "@arcscord/discord-ui-core";
  import type { UserInteractionHandlers } from "../interactions.js";

  export type MessageHeaderProps = UserInteractionHandlers & { author: MessageAuthor; timestamp: string; edited?: boolean | undefined };
</script>

<script lang="ts">
  import Author from "../author/Author.svelte";
  import { getDisplayOptions } from "../display-context.js";
  import MessageTimestamp from "./MessageTimestamp.svelte";

  const { onUserClick, onUserContextMenu, author, timestamp, edited = false }: MessageHeaderProps = $props();
  const display = getDisplayOptions();
</script>

<header class="dui-message-header">
  <Author {onUserClick} {onUserContextMenu} {author} />
  <MessageTimestamp {timestamp} />
  {#if edited}<span class="dui-message-edited">{display().labels.edited}</span>{/if}
</header>
