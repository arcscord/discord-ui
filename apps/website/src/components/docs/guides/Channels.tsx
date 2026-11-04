import type { ChannelViewModel } from "@arcscord/discord-ui";
import { ChannelView, DiscordUI } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

const author = { id: "guide-bot", displayName: "Guide Bot", bot: true };
const timestamp = "2026-11-01T10:24:00Z";

export default function Channels(): React.ReactElement {
  const [channel, setChannel] = useState<ChannelViewModel>({ id: "support", name: "support", messages: [] });
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      <ChannelView
        channel={channel}
        height={320}
        showDateSeparators={false}
        onSend={content => setChannel(current => ({
          ...current,
          messages: [
            ...current.messages,
            {
              id: `message-${current.messages.length + 1}`,
              author,
              timestamp,
              body: { kind: "text", content },
            },
          ],
        }))}
      />
    </DiscordUI>
  );
}
