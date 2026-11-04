import type { MessageView } from "@arcscord/discord-ui";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

const message: MessageView = {
  id: "hello",
  author: { id: "welcome-bot", displayName: "Welcome Bot", bot: true },
  timestamp: "2026-11-01T10:24:00Z",
  body: {
    kind: "markdown",
    content: "**Hello from React!** Try this spoiler: ||You found it!||",
  },
};

export default function FirstMessage(): React.ReactElement {
  return (
    <DiscordUI
      theme="dark"
      locale="en-US"
      timeZone="UTC"
      referenceTime="2026-11-01T10:24:00Z"
    >
      <Message message={message} />
    </DiscordUI>
  );
}
