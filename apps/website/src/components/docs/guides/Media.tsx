import type { MessageMediaView } from "@arcscord/discord-ui";
import { Audio, DiscordUI, File, MediaGallery, Sticker } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

const items: readonly MessageMediaView[] = [
  {
    id: "landscape",
    url: "/examples/landscape.svg",
    alt: "Illustrated mountain landscape",
    width: 600,
    height: 320,
  },
  {
    id: "trail-video",
    kind: "video",
    url: "/examples/trail.webm",
    posterUrl: "/examples/trail-poster.png",
    alt: "A short illustrated trail preview",
    width: 240,
    height: 135,
  },
  {
    id: "surprise",
    url: "/examples/landscape.svg",
    alt: "Hidden mountain landscape",
    width: 600,
    height: 320,
    spoiler: true,
  },
];
export default function MediaExample(): React.ReactElement {
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC" allowRemoteMedia={false}>
      <MediaGallery items={items} />
      <Audio audio={{
        id: "voice",
        kind: "audio",
        url: "/examples/trail.wav",
        name: "Trail voice note",
        voice: true,
        durationSeconds: 3,
        waveform: [0.2, 0.5, 0.8, 0.4, 0.9, 0.3],
      }}
      />
      <Sticker sticker={{
        id: "marker",
        name: "Arcscord sticker",
        format: "png",
        url: "/examples/arcscord-sticker.png",
      }}
      />
      <File file={{
        id: "report",
        kind: "file",
        name: "report.pdf",
        url: "https://example.com/report.pdf",
        size: "24 KB",
        spoiler: true,
      }}
      />
    </DiscordUI>
  );
}
