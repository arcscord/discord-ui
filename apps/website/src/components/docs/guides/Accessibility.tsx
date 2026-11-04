import { Button, DiscordUI, Spoiler } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

export default function AccessiblePreview(): React.ReactElement {
  const [result, setResult] = useState("No action yet.");
  return (
    <DiscordUI
      theme="ash"
      locale="en-US"
      timeZone="UTC"
      labels={{ showSpoiler: "Reveal the review note", hideSpoiler: "Hide the review note" }}
    >
      <p>
        Review note:
        <Spoiler>Check the translated labels before publishing.</Spoiler>
      </p>
      <Button label="Confirm review" onClick={() => setResult("Review confirmed locally.")} />
      <p role="status">{result}</p>
    </DiscordUI>
  );
}
