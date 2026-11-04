import { DiscordUI, Markdown } from "@arcscord/discord-ui";
import { renderHighlightedCode } from "@arcscord/discord-ui/highlight";
import React from "react";
import "@arcscord/discord-ui/styles.css";

export default function HighlightModule(): React.ReactElement {
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC" renderCode={renderHighlightedCode}>
      <Markdown content={"```typescript\nconst greeting = \"Hello\";\n```"} />
    </DiscordUI>
  );
}
