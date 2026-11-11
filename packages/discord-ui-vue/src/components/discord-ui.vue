<script setup lang="ts">
import type { DiscordUIProps, DiscordUISlots } from "../display-context";
import { defaultDisplayOptions, resolveTheme, themeStyle } from "@arcscord/discord-ui-core";
import { computed, provide, reactive } from "vue";
import { displayKey } from "../display-context";

const props = withDefaults(defineProps<DiscordUIProps>(), { allowRemoteMedia: defaultDisplayOptions.allowRemoteMedia });
defineSlots<DiscordUISlots>();
const resolvedTheme = computed(() => resolveTheme(props.theme ?? defaultDisplayOptions.theme, props.tokens));
const options = computed(() => ({
  ...defaultDisplayOptions,
  ...Object.fromEntries(Object.entries(props).filter(([, value]) => value !== undefined)),
  labels: {
    ...defaultDisplayOptions.labels,
    ...props.labels,
  },
  scoped: true,
  resolvedTheme: resolvedTheme.value,
}));
// Getter forwarding keeps provide/inject reactive when the host replaces props.
provide(displayKey, reactive(new Proxy({} as typeof options.value, {
  get: (_target, key) => Reflect.get(options.value, key),
  has: (_target, key) => Reflect.has(options.value, key),
  ownKeys: () => Reflect.ownKeys(options.value),
  getOwnPropertyDescriptor: () => ({ enumerable: true, configurable: true }),
})));
</script>

<template>
  <div class="arcscord-discord-ui" :data-theme="resolvedTheme.name" :data-base-theme="resolvedTheme.base" :data-color-scheme="resolvedTheme.colorScheme" :style="themeStyle(resolvedTheme.tokens)">
    <slot />
  </div>
</template>
