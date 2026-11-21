<script module lang="ts">
  import type { MessageAuthor } from "@arcscord/discord-ui-core";
  import type { UserInteractionHandlers } from "../interactions.js";

  export type AvatarProps = UserInteractionHandlers & { author: MessageAuthor };
  const backgrounds = [
    "#5865f2",
    "#3b8066",
    "#a94c70",
    "#98601d",
    "#6955a4",
    "#337c96",
  ];
  const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

  function avatarHash(id: string): number {
    let hash = 0;
    for (const character of id)
      hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
    return hash;
  }
</script>

<script lang="ts">
  import { mediaUrl } from "@arcscord/discord-ui-core";
  import { contextMenuKeyboard } from "../context-menu-keyboard.js";
  import { getDisplayOptions, hexColor } from "../display-context.js";

  const { onUserClick, onUserContextMenu, author }: AvatarProps = $props();
  const display = getDisplayOptions();
  const source = $derived(mediaUrl(author.avatarUrl, display().allowRemoteMedia, display().remoteMediaAllowlist));
  const background = $derived(hexColor(author.avatarFallback?.background) ?? backgrounds[avatarHash(author.id) % backgrounds.length]);
  const foreground = $derived(hexColor(author.avatarFallback?.color) ?? "#ffffff");
  const text = $derived(author.avatarFallback?.letter?.trim() || author.displayName.trim());
  const letter = $derived(Array.from(segmenter.segment(text))[0]?.segment.toLocaleUpperCase("en-US") || "?");
  let failedSource = $state<string>();
  let image = $state<HTMLImageElement>();
  const showImage = $derived(source && failedSource !== source);
  $effect(() => {
    const current = source;
    if (image?.complete && current && image.getAttribute("src") === current && image.naturalWidth === 0)
      failedSource = current;
  });
  $effect.pre(() => {
    // A different source starts with a fresh image, even when URLs cycle.
    void source;
    failedSource = undefined;
  });
</script>

<svelte:element this={onUserClick ? "button" : "span"} type={onUserClick ? "button" : undefined} class={["dui-avatar", (onUserClick || onUserContextMenu) && "dui-utility-target"]} aria-hidden={onUserClick || onUserContextMenu
  ? undefined
  : true} role={!onUserClick && onUserContextMenu
  ? "img"
  : undefined} aria-label={onUserClick || onUserContextMenu
  ? author.displayName
  : undefined} tabindex={!onUserClick && onUserContextMenu
  ? 0
  : undefined} onclick={onUserClick
  ? (event: MouseEvent) => onUserClick?.(author, event)
  : undefined} onkeydown={onUserContextMenu ? contextMenuKeyboard : undefined} oncontextmenu={onUserContextMenu
  ? (event: MouseEvent) => {
    event.stopPropagation();
    onUserContextMenu?.(author, event);
  }
  : undefined} style:background={showImage ? "transparent" : background} style:color={foreground}>
  {#if source && showImage}
    <img src={source} alt="" width={40} height={40} bind:this={image} onerror={() => failedSource = source} />
  {:else}
    <span aria-hidden={onUserClick || onUserContextMenu
      ? true
      : undefined}>{letter}</span>
  {/if}
</svelte:element>
