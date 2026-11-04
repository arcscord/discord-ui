import type { MessageView } from "@arcscord/discord-ui";
import { Button, DiscordUI, Message } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

const author = { id: "guide-bot", displayName: "Guide Bot", bot: true };
const timestamp = "2026-11-01T10:24:00Z";

const message: MessageView = {
  id: "reply",
  author,
  timestamp,
  edited: true,
  ephemeral: true,
  reply: {
    messageId: "question",
    author: { id: "reader", displayName: "Sam" },
    content: "Is the preview ready?",
  },
  body: { kind: "markdown", content: "**Your preview is ready.**" },
};
export default function Messages(): React.ReactElement {
  const [visible, setVisible] = useState(true);
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      {visible
        ? <Message message={message} onEphemeralDismiss={() => setVisible(false)} />
        : <Button label="Restore preview" onClick={() => setVisible(true)} />}
    </DiscordUI>
  );
}
