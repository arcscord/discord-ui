import type { MediaView } from "@arcscord/discord-ui";
import { DiscordUI, File, MediaGallery } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

const items: readonly MediaView[] = [
  {
    id: "landscape",
    url: "/examples/landscape.svg",
    alt: "Illustrated mountain landscape",
    width: 600,
    height: 320,
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
