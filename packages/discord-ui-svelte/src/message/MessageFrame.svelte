<script module lang="ts">
  import type { Snippet } from "svelte";

  export type MessageFrameProps = {
    onContextMenu?: ((event: MouseEvent) => void) | undefined;
    hasThread?: boolean;
    ephemeral?: boolean;
    mentioned?: boolean;
    reply?: Snippet | undefined;
    avatar?: Snippet;
    header?: Snippet;
    footer?: Snippet;
    children: Snippet;
  };
</script>

<script lang="ts">
  import { contextMenuKeyboard } from "../context-menu-keyboard.js";
  import { getDisplayOptions, themeCss } from "../display-context.js";

  const { onContextMenu, avatar, reply, header, footer, children, ephemeral = false, mentioned = false, hasThread = false }: MessageFrameProps = $props();
  const display = getDisplayOptions();
  const theme = $derived(display().resolvedTheme);
  const scoped = $derived(display().scoped);

  function contextMenu(event: MouseEvent): void {
    const target = event.target;
    if (target instanceof Element && !target.closest(".dui-utility-target")
      && target.closest("a[href],button,input,select,textarea,summary,[contenteditable=\"true\"],[role=\"button\"],[role=\"link\"],[role=\"textbox\"],[role=\"combobox\"],[role=\"listbox\"],[role=\"menu\"],[role=\"menuitem\"],[role=\"checkbox\"],[role=\"radio\"],[role=\"slider\"],[role=\"spinbutton\"],[role=\"switch\"],audio[controls],video[controls]")) {
      return;
    }
    onContextMenu?.(event);
  }
</script>

<!-- svelte-ignore a11y_no_noninteractive_tabindex, a11y_no_noninteractive_element_interactions (Message context menus support keyboard context access.) -->
<article onkeydown={onContextMenu ? contextMenuKeyboard : undefined} oncontextmenu={onContextMenu ? contextMenu : undefined} tabindex={onContextMenu ? 0 : undefined} class={[!scoped && "arcscord-discord-ui", "dui-message"]} data-ephemeral={ephemeral || undefined} data-mentioned={mentioned || undefined} aria-label={mentioned
  ? display().labels.mentionedMessage
  : undefined} data-has-thread={hasThread || undefined} data-theme={theme.name} data-base-theme={scoped ? undefined : theme.base} data-color-scheme={theme.colorScheme} style={scoped
  ? undefined
  : themeCss(theme.tokens)}>
  {#if reply}<div class="dui-message-reply">{@render reply()}</div>{/if}
  <div class="dui-message-avatar">{@render avatar?.()}</div>
  <div class="dui-message-main">
    {@render header?.()}
    <div class="dui-message-body">{@render children()}</div>
    {@render footer?.()}
  </div>
</article>
