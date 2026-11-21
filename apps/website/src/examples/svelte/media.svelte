<script lang="ts">
  import type { MessageView } from "@arcscord/discord-ui-svelte";
  import { DiscordUI, Message } from "@arcscord/discord-ui-svelte";
  import "@arcscord/discord-ui-svelte/styles.css";

  const message: MessageView = {
    id: "trail-media",
    author: { id: "guide", displayName: "Field Guide" },
    timestamp: "2026-11-01T10:24:00Z",
    body: { kind: "text", content: "A trail preview and a voice note." },
    media: [
      {
        id: "video",
        kind: "video",
        url: "/examples/trail.webm",
        posterUrl: "/examples/trail-poster.png",
        alt: "Trail preview",
        width: 240,
        height: 135,
      },
    ],
    attachments: [
      {
        id: "voice",
        kind: "audio",
        url: "/examples/trail.wav",
        name: "Trail voice note",
        voice: true,
        durationSeconds: 3,
        waveform: [0.2, 0.5, 0.8, 0.4, 0.9, 0.3],
      },
    ],
    stickers: [
      {
        id: "marker",
        name: "Arcscord sticker",
        format: "png",
        url: "/examples/arcscord-sticker.png",
      },
    ],
  };
</script>

<DiscordUI theme="dark" allowRemoteMedia={false} locale="en-US" timeZone="UTC">
  <Message {message} />
</DiscordUI>
