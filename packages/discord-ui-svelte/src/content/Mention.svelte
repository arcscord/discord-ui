<script module lang="ts">
  import type { MentionTarget } from "@arcscord/discord-ui-core";
  import type { MentionInteractionHandlers } from "../interactions.js";

  export type MentionProps = MentionInteractionHandlers & { id?: string | undefined; name: string; kind?: "user" | "role" | "channel" | "command"; color?: string | undefined };
</script>

<script lang="ts">
  import { contextMenuKeyboard } from "../context-menu-keyboard.js";
  import { hexColor } from "../display-context.js";
  import { getMentionInteractions } from "../mention-context.js";

  const { id, name, kind = "user", color, onMentionClick, onMentionContextMenu }: MentionProps = $props();
  const inherited = getMentionInteractions();
  const click = $derived(id
    ? onMentionClick ?? inherited().onMentionClick
    : undefined);
  const contextMenu = $derived(id
    ? onMentionContextMenu ?? inherited().onMentionContextMenu
    : undefined);
  const target = $derived({ id: id ?? "", name, kind, color } satisfies MentionTarget);
</script>

<!-- svelte-ignore a11y_no_static_element_interactions (Context-menu targets support keyboard context access.) -->
<svelte:element this={click ? "button" : "span"} type={click ? "button" : undefined} class={["dui-mention", (click || contextMenu) && "dui-utility-target"]} style:color={hexColor(color)} tabindex={!click && contextMenu
  ? 0
  : undefined} onclick={click
  ? (event: MouseEvent) => click?.(target, event)
  : undefined} onkeydown={contextMenu ? contextMenuKeyboard : undefined} oncontextmenu={contextMenu
  ? (event: MouseEvent) => {
    event.stopPropagation();
    contextMenu?.(target, event);
  }
  : undefined}>{kind === "channel"
  ? "#"
  : kind === "command"
  ? "/"
  : "@"}{name}</svelte:element>
