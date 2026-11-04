import type { SlashCommand } from "@arcscord/discord-ui";
import { ChannelComposer, DiscordUI } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

const commands: readonly SlashCommand[] = [
  {
    name: "welcome",
    description: "Prepare a welcome preview",
    application: "Guide Bot",
    arguments: [
      {
        name: "audience",
        description: "Who is it for?",
        required: true,
        choices: [
          { name: "Members", value: "members" },
          { name: "Moderators", value: "moderators" },
        ],
      },
    ],
  },
];
export default function Composer(): React.ReactElement {
  const [draft, setDraft] = useState("");
  const [result, setResult] = useState("Type /welcome to start.");
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      <ChannelComposer
        channelName="support"
        value={draft}
        onValueChange={setDraft}
        commands={commands}
        onSend={(content) => {
          setResult(content);
          setDraft("");
        }}
        onSlashCommand={invocation => setResult(`/${invocation.command.name}: ${invocation.arguments.audience}`)}
      />
      <p role="status">{result}</p>
    </DiscordUI>
  );
}
