<script setup lang="ts">
import type { ThemeName } from "@arcscord/discord-ui-vue";
import { DiscordUI, MessageHeader } from "@arcscord/discord-ui-vue";
import { defineTheme } from "@arcscord/discord-ui-vue/themes";
import { computed, ref } from "vue";
import "@arcscord/discord-ui-vue/styles.css";

const base = ref<ThemeName>("ash");
const locale = ref<"en-US" | "fr-CH">("en-US");
const theme = computed(() => defineTheme({
  name: "my-brand",
  extends: base.value,
  tokens: { accent: "#5865f2" },
}));
const timeZone = computed(() => locale.value === "fr-CH"
  ? "Europe/Zurich"
  : "UTC");
const labels = computed(() => ({
  edited: locale.value === "fr-CH"
    ? "(modifié)"
    : "(edited)",
}));
const author = { id: "theme-demo", displayName: "Theme Demo" };
</script>

<template>
  <p>
    <label>
      Base theme
      <select v-model="base">
        <option value="light">Light</option>
        <option value="ash">Ash</option>
        <option value="dark">Dark</option>
      </select>
    </label>
    <label>
      Locale
      <select v-model="locale">
        <option value="en-US">English</option>
        <option value="fr-CH">French (Switzerland)</option>
      </select>
    </label>
  </p>
  <DiscordUI :theme="theme" :locale="locale" :time-zone="timeZone" :labels="labels">
    <MessageHeader :author="author" timestamp="2026-11-01T10:24:00Z" edited />
  </DiscordUI>
</template>
