<script module lang="ts">
  import type { MessageAuthor } from "@arcscord/discord-ui-core";
  import type { UserInteractionHandlers } from "../interactions.js";

  export type AuthorProps = UserInteractionHandlers & { author: MessageAuthor };
</script>

<script lang="ts">
  import { contextMenuKeyboard } from "../context-menu-keyboard.js";
  import { hexColor } from "../display-context.js";

  const { onUserClick, onUserContextMenu, author }: AuthorProps = $props();
</script>

<span class="dui-author">
  <!-- svelte-ignore a11y_no_static_element_interactions (Context-menu targets support keyboard context access.) -->
  <svelte:element this={onUserClick ? "button" : "span"} type={onUserClick ? "button" : undefined} class={["dui-author-name", (onUserClick || onUserContextMenu) && "dui-utility-target"]} style:color={hexColor(author.color)} tabindex={!onUserClick && onUserContextMenu
    ? 0
    : undefined} onclick={onUserClick
    ? (event: MouseEvent) => onUserClick?.(author, event)
    : undefined} onkeydown={onUserContextMenu ? contextMenuKeyboard : undefined} oncontextmenu={onUserContextMenu
    ? (event: MouseEvent) => {
      event.stopPropagation();
      onUserContextMenu?.(author, event);
    }
    : undefined}>{author.displayName}</svelte:element>{#if author.bot}<span class="dui-bot-badge">{author.verified ? "✓ APP" : "APP"}</span>{/if}
</span>
