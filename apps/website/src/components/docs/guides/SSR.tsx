import type { MessageView } from "@arcscord/discord-ui";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

const author = { id: "guide-bot", displayName: "Guide Bot", bot: true };
const timestamp = "2026-11-01T10:24:00Z";

const message: MessageView = {
  id: "stable",
  author,
  timestamp,
  body: { kind: "markdown", content: "Updated <t:1793528640:R>. This output uses explicit display options." },
};
// Share this snapshot and these display options between server and client.
export default function StablePreview(): React.ReactElement {
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC" referenceTime="2026-11-01T11:24:00Z">
      <Message message={message} />
    </DiscordUI>
  );
}
