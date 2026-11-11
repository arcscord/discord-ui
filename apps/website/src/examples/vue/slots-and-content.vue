<script setup lang="ts">
import { ActionRow, Button, Container, DiscordUI, Embed, File, LinkButton, Markdown, MediaGallery, MessageFrame, MessageHeader, Section, Separator, TextDisplay, Thumbnail } from "@arcscord/discord-ui-vue";
import { renderHighlightedCode } from "@arcscord/discord-ui-vue/highlight";
import { ref } from "vue";
import "@arcscord/discord-ui-vue/styles.css";

const clicks = ref(0);
const author = {
  id: "demo",
  displayName: "Vue Author",
  avatarFallback: { letter: "V" },
};
</script>

<template>
  <DiscordUI theme="light" :render-code="renderHighlightedCode" :allow-remote-media="false">
    <MessageFrame>
      <template #header>
        <MessageHeader :author="author" timestamp="2026-11-01T10:24:00Z" edited />
      </template>
      <Markdown content="**Rich content** with ||a spoiler|| and 👋" />
      <Embed :embed="{ id: 'embed', title: 'Embed', description: 'An embedded **description**.', fields: [{ id: 'field', name: 'Field', value: 'Value' }] }" />
      <MediaGallery :items="[{ id: 'image', url: '/examples/landscape.svg', alt: 'Landscape' }]" />
      <Container accent-color="#5865f2">
        <Section>
          <TextDisplay content="Composable Components V2" /><template #accessory>
            <Thumbnail :media="{ id: 'thumb', url: '/examples/landscape.svg', alt: 'Landscape' }" />
          </template>
        </Section>
        <Separator />
        <ActionRow><Button label="Click" variant="secondary" @click="clicks++" /><LinkButton label="Documentation" url="https://ui.arcscord.dev" /></ActionRow>
        <File :file="{ id: 'file', kind: 'file', name: 'welcome-config.json', url: '/examples/welcome-config.json' }" />
      </Container>
      <template #footer>
        <p role="status">
          Clicks: {{ clicks }}
        </p>
      </template>
    </MessageFrame>
  </DiscordUI>
</template>
