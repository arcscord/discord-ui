import type { ReactionView } from "@arcscord/discord-ui";
import { DiscordUI, Reactions } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

export default function ReactionExample(): React.ReactElement {
  const [reactions, setReactions] = useState<readonly ReactionView[]>([
    {
      id: "thanks",
      emoji: { name: "👍" },
      count: 3,
      me: false,
    },
  ]);
  return (
    <DiscordUI theme="dark" allowRemoteMedia={false} locale="en-US" timeZone="UTC">
      <Reactions
        reactions={reactions}
        onToggle={id => setReactions(current => current.map(reaction =>
          reaction.id === id
            ? { ...reaction, me: !reaction.me, count: reaction.count + (reaction.me
                ? -1
                : 1) }
            : reaction))}
      />
    </DiscordUI>
  );
}
