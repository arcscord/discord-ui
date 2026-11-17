<script lang="ts">
  import type { DiscordUIProps } from "./display-context.js";
  import { defaultDisplayOptions, resolveTheme } from "@arcscord/discord-ui-core";
  import { setContext } from "svelte";
  import { displayKey, themeCss } from "./display-context.js";

  const { children, class: className, labels, ...options }: DiscordUIProps = $props();
  const resolvedTheme = $derived(resolveTheme(options.theme ?? defaultDisplayOptions.theme, options.tokens));
  const display = $derived({
    ...defaultDisplayOptions,
    ...options,
    entities: options.entities ?? defaultDisplayOptions.entities,
    allowRemoteMedia: options.allowRemoteMedia ?? defaultDisplayOptions.allowRemoteMedia,
    locale: options.locale ?? defaultDisplayOptions.locale,
    timeZone: options.timeZone ?? defaultDisplayOptions.timeZone,
    labels: {
      ...defaultDisplayOptions.labels,
      ...labels,
    },
    scoped: true,
    resolvedTheme,
  });
  const style = $derived(themeCss(resolvedTheme.tokens));
  setContext(displayKey, () => display);
</script>

<div class={["arcscord-discord-ui", className]} data-theme={resolvedTheme.name} data-base-theme={resolvedTheme.base} data-color-scheme={resolvedTheme.colorScheme} {style}>
  {@render children()}
</div>
