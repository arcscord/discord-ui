<script setup lang="ts">
import type { MessageEntities } from "@arcscord/discord-ui-vue";
import { Avatar, DiscordUI, Markdown } from "@arcscord/discord-ui-vue";
import { computed, onMounted, ref } from "vue";
import "@arcscord/discord-ui-vue/styles.css";

const allowlistEnabled = ref(true);
const origin = ref("");
const discordEmojiDirectory = "https://cdn.discordapp.com/emojis/";
const emojiId = "456789012345678901";

// Use absolute local fixture URLs to exercise the same checks as CDN images.
onMounted(() => {
  origin.value = window.location.origin;
});

const remoteMediaAllowlist = computed(() => allowlistEnabled.value
  ? [
      discordEmojiDirectory,
      ...(origin.value
        ? [`${origin.value}/examples/`]
        : []),
    ]
  : []);
const entities = computed<MessageEntities>(() => ({
  emojis: origin.value
    ? {
        [emojiId]: { name: "arc", image: `${origin.value}/examples/emoji.svg` },
      }
    : {},
}));
const author = {
  id: "demo",
  displayName: "Blocked avatar",
  avatarFallback: { letter: "B" },
};
</script>

<template>
  <p>
    <label><input v-model="allowlistEnabled" type="checkbox"> Enable the image allowlist</label>
  </p>
  <DiscordUI
    theme="dark"
    :allow-remote-media="false"
    :remote-media-allowlist="remoteMediaAllowlist"
    :entities="entities"
  >
    <Markdown :content="`Custom emoji <:arc:${emojiId}>`" />
    <Avatar v-if="origin" :author="{ ...author, avatarUrl: `${origin}/img/favicon.png` }" />
  </DiscordUI>
</template>
