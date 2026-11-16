<script module lang="ts">
  import type { MessageAuthor } from "@arcscord/discord-ui-core";

  export type MessageHeaderProps = { author: MessageAuthor; timestamp: string; edited?: boolean | undefined };
</script>

<script lang="ts">
  import Author from "../author/Author.svelte";
  import { getDisplayOptions } from "../display-context.js";
  import MessageTimestamp from "./MessageTimestamp.svelte";

  const { author, timestamp, edited = false }: MessageHeaderProps = $props();
  const display = getDisplayOptions();
</script>

<header class="dui-message-header">
  <Author {author} />
  <MessageTimestamp {timestamp} />
  {#if edited}<span class="dui-message-edited">{display().labels.edited}</span>{/if}
</header>
