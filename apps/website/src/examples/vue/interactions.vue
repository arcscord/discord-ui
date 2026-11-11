<script setup lang="ts">
import type { MessageView, StringSelectMenuView } from "@arcscord/discord-ui-vue";
import { DiscordUI, Message, SelectMenu } from "@arcscord/discord-ui-vue";
import { computed, ref } from "vue";
import "@arcscord/discord-ui-vue/styles.css";

const selections = ref<string[]>([]);
const waves = ref(0);
const reacted = ref(false);
const menu: StringSelectMenuView = {
  id: "topics",
  kind: "string-select",
  minValues: 0,
  maxValues: 2,
  placeholder: "Choose topics",
  options: [
    { value: "vue", label: "Vue" },
    { value: "core", label: "Core" },
  ],
};
const message = computed<MessageView>(() => ({
  id: "interactive",
  author: { id: "bot", displayName: "Vue Bot", bot: true },
  timestamp: "2026-11-01T10:24:00Z",
  body: {
    kind: "components-v2",
    components: [
      { id: "text", kind: "text-display", content: "Press the button or react 👋" },
      {
        id: "row",
        kind: "action-row",
        buttons: [
          { id: "wave", kind: "button", label: "Wave" },
        ],
      },
    ],
  },
  reactions: [
    {
      id: "wave",
      emoji: { name: "👋" },
      count: reacted.value ? 2 : 1,
      me: reacted.value,
    },
  ],
}));
</script>

<template>
  <DiscordUI theme="ash" reference-time="2026-11-01T10:24:00Z">
    <SelectMenu v-model:values="selections" :menu="menu" />
    <Message :message="message" @button-click="waves++" @reaction-toggle="reacted = !reacted" />
    <p role="status">
      Waves: {{ waves }}; topics: {{ selections.join(', ') || 'none' }}
    </p>
  </DiscordUI>
</template>
