import type { MessageView } from "@arcscord/discord-ui";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

const author = { id: "guide-bot", displayName: "Guide Bot", bot: true };
const timestamp = "2026-11-01T10:24:00Z";

const message: MessageView = {
  id: "layout",
  author,
  timestamp,
  body: {
    kind: "components-v2",
    components: [
      {
        id: "card",
        kind: "container",
        accentColor: "#5865f2",
        components: [
          { id: "intro", kind: "text-display", content: "## Ready to review\nThis is a Components V2 layout." },
          { id: "divider", kind: "separator", spacing: "small" },
          {
            id: "row",
            kind: "action-row",
            buttons: [
              {
                id: "approve",
                kind: "button",
                label: "Approve",
                style: "success",
              },
            ],
          },
        ],
      },
    ],
  },
};
export default function ComponentsV2(): React.ReactElement {
  const [status, setStatus] = useState("Waiting for approval");
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      <Message message={message} onButtonClick={(id, context) => setStatus(`${context.messageId}: ${id}`)} />
      <p role="status">{status}</p>
    </DiscordUI>
  );
}
