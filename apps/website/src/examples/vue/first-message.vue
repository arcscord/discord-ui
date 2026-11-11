<script setup lang="ts">
import type { MessageView } from "@arcscord/discord-ui-vue";
import { DiscordUI, Message } from "@arcscord/discord-ui-vue";
import "@arcscord/discord-ui-vue/styles.css";

const message: MessageView = {
  id: "hello",
  author: { id: "welcome", displayName: "Vue Bot", bot: true },
  timestamp: "2026-11-01T10:24:00Z",
  body: { kind: "markdown", content: "**Hello from Vue!** Try this spoiler: ||You found it!||" },
};
</script>

<template>
  <DiscordUI theme="dark" locale="en-US" time-zone="UTC" reference-time="2026-11-01T10:24:00Z">
    <Message :message="message" />
  </DiscordUI>
</template>
