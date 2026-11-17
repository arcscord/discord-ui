<script module lang="ts">
  import type { MessageAuthor } from "@arcscord/discord-ui-core";

  export type AuthorProps = { author: MessageAuthor };
</script>

<script lang="ts">
  import { hexColor } from "../display-context.js";

  const { author }: AuthorProps = $props();
</script>

<span class="dui-author"><span class="dui-author-name" style:color={hexColor(author.color)}>{author.displayName}</span>{#if author.bot}<span class="dui-bot-badge">{author.verified ? "✓ APP" : "APP"}</span>{/if}</span>
