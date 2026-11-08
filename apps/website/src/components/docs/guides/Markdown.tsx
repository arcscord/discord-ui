import { Button, DiscordUI, Emoji, Markdown } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

export default function MarkdownExample(): React.ReactElement {
  const [waves, setWaves] = useState(0);
  return (
    <DiscordUI
      theme="dark"
      allowRemoteMedia={false}
      unicodeEmoji={{ mode: "twemoji", baseUrl: "/examples/twemoji" }}
      locale="en-US"
      timeZone="UTC"
      referenceTime="2026-11-01T10:24:00Z"
      entities={{
        users: {
          "123456789012345678": { name: "Sam" },
        },
        channels: {
          "223456789012345678": { name: "support" },
        },
      }}
    >
      <Markdown content={"## Welcome, <@123456789012345678>!\nVisit <#223456789012345678> for **help**, `code` and ||spoilers||. 👋\n- Read the guide\n- Try the preview"} />
      <Button label="" ariaLabel="Wave hello" emoji={<Emoji name="👋" />} onClick={() => setWaves(value => value + 1)} />
      <Emoji name="arc" image="/examples/emoji.svg" />
      <p role="status">{`Waves: ${waves}`}</p>
    </DiscordUI>
  );
}
