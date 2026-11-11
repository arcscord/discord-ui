<script setup lang="ts">
import type { SpoilerProps, SpoilerSlots } from "./spoiler";
import { ref } from "vue";
import { useDisplayOptions } from "../../display-context";

const { inline = true } = defineProps<SpoilerProps>();
defineSlots<SpoilerSlots>();
const options = useDisplayOptions();
const revealed = ref(false);
</script>

<template>
  <component :is="inline ? 'span' : 'div'" :class="inline ? 'dui-revealable-text' : 'dui-revealable-media'" :data-revealed="revealed">
    <component :is="inline ? 'span' : 'div'" class="dui-spoiler-content" :aria-hidden="!revealed" :inert="!revealed">
      <slot v-if="inline || revealed" />
      <slot v-else name="placeholder">
        <div class="dui-media-placeholder" />
      </slot>
    </component>
    <button type="button" :class="revealed ? 'dui-spoiler-close' : 'dui-spoiler-toggle'" :aria-expanded="revealed" :aria-label="revealed ? options.labels.hideSpoiler : options.labels.showSpoiler" @click="revealed = !revealed">
      <template v-if="revealed">
        ×
      </template>
      <span v-else-if="!inline" class="dui-spoiler-badge" aria-hidden="true">{{ options.labels.spoiler }}</span>
    </button>
  </component>
</template>
