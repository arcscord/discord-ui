import type { ChannelViewModel } from "@arcscord/discord-ui";
import { ChannelView, DiscordUI } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

const author = { id: "guide-bot", displayName: "Guide Bot", bot: true };
const timestamp = "2026-11-01T10:24:00Z";

const channel: ChannelViewModel = {
  id: "support",
  name: "support",
  messages: [
    {
      id: "question",
      author,
      timestamp,
      body: { kind: "text", content: "How do I configure this?" },
      thread: { id: "setup", name: "Setup help", messageCount: 1 },
    },
  ],
  threads: [
    {
      id: "setup",
      name: "Setup help",
      parentMessageId: "question",
      messages: [
        {
          id: "answer",
          author,
          timestamp,
          body: { kind: "text", content: "Start with the quick start guide." },
        },
      ],
    },
  ],
};
export default function Threads(): React.ReactElement {
  const [active, setActive] = useState<string | null>(null);
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      <ChannelView
        channel={channel}
        height={360}
        composer={false}
        composerDisabled
        activeThreadId={active}
        onThreadOpen={setActive}
        onThreadClose={() => setActive(null)}
      />
    </DiscordUI>
  );
}
