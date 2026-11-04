import { DiscordUI, Markdown } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

export default function MarkdownExample(): React.ReactElement {
  return (
    <DiscordUI
      theme="dark"
      allowRemoteMedia={false}
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
    </DiscordUI>
  );
}
