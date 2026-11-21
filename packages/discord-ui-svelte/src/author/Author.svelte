<script module lang="ts">
  import type { MessageAuthor } from "@arcscord/discord-ui-core";
  import type { UserInteractionHandlers } from "../interactions.js";

  export type AuthorProps = UserInteractionHandlers & { author: MessageAuthor };
</script>

<script lang="ts">
  import { mediaUrl } from "@arcscord/discord-ui-core";
  import { contextMenuKeyboard } from "../context-menu-keyboard.js";
  import { getDisplayOptions, hexColor } from "../display-context.js";

  const { onUserClick, onUserContextMenu, author }: AuthorProps = $props();
  const display = getDisplayOptions();
  const tagBadge = $derived(mediaUrl(author.tag?.badgeUrl, display().allowRemoteMedia, display().remoteMediaAllowlist));
</script>

<span class="dui-author">
  <!-- svelte-ignore a11y_no_static_element_interactions (Context-menu targets support keyboard context access.) -->
  <svelte:element this={onUserClick || onUserContextMenu
    ? "button"
    : "span"} type={onUserClick || onUserContextMenu
    ? "button"
    : undefined} class={["dui-author-name", (onUserClick || onUserContextMenu) && "dui-utility-target"]} style:color={hexColor(author.color)} aria-haspopup={!onUserClick && onUserContextMenu
    ? "menu"
    : undefined} onclick={onUserClick || onUserContextMenu
    ? (event: MouseEvent) => {
      if (onUserClick) {
        onUserClick(author, event);
      }
      else {
        event.stopPropagation();
        onUserContextMenu?.(author, event);
      }
    }
    : undefined} onkeydown={onUserContextMenu ? contextMenuKeyboard : undefined} oncontextmenu={onUserContextMenu
    ? (event: MouseEvent) => {
      event.stopPropagation();
      onUserContextMenu?.(author, event);
    }
    : undefined}>{author.displayName}</svelte:element>{#if author.tag?.text}<span class="dui-author-tag">{#if tagBadge}<img class="dui-author-tag-badge" src={tagBadge} alt="" width="13" height="13" />{/if}<span class="dui-author-tag-text">{author.tag.text}</span></span>{/if}{#if author.bot}<span class="dui-bot-badge">{author.verified ? "✓ APP" : "APP"}</span>{/if}
</span>
