<script module lang="ts">
  import type { Snippet } from "svelte";

  export type MessageFrameProps = {
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
  import { getDisplayOptions, themeCss } from "../display-context.js";

  const { avatar, reply, header, footer, children, ephemeral = false, mentioned = false, hasThread = false }: MessageFrameProps = $props();
  const display = getDisplayOptions();
  const theme = $derived(display().resolvedTheme);
  const scoped = $derived(display().scoped);
</script>

<article class={[!scoped && "arcscord-discord-ui", "dui-message"]} data-ephemeral={ephemeral || undefined} data-mentioned={mentioned || undefined} aria-label={mentioned
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
