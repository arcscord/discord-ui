import type { EmbedView } from "@arcscord/discord-ui";
import { DiscordUI, Embed } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

const embed: EmbedView = {
  id: "release",
  title: "Release preview",
  color: "#5865f2",
  description: "Review the **changes** before sharing.",
  fields: [
    {
      id: "status",
      name: "Status",
      value: "Ready",
      inline: true,
    },
    {
      id: "scope",
      name: "Scope",
      value: "Documentation",
      inline: true,
    },
  ],
  footer: { text: "Local preview" },
  timestamp: "2026-11-01T10:24:00Z",
};
export default function Embeds(): React.ReactElement {
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      <Embed embed={embed} />
    </DiscordUI>
  );
}
