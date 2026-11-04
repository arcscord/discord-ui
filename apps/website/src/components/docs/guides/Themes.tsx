import type { MessageView, ThemeName } from "@arcscord/discord-ui";
import { defineTheme, DiscordUI, Message } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

const author = { id: "guide-bot", displayName: "Guide Bot", bot: true };
const timestamp = "2026-11-01T10:24:00Z";

const message: MessageView = {
  id: "theme",
  author,
  timestamp,
  body: { kind: "text", content: "A scoped theme preview." },
};
const violet = defineTheme({
  name: "violet",
  extends: "ash",
  tokens: { accent: "#a7a9ff", link: "#c4b5fd" },
});
export default function Themes(): React.ReactElement {
  const [preset, setPreset] = useState<ThemeName>("dark");
  return (
    <div>
      <label>
        Preview theme
        {" "}
        <select value={preset} onChange={event => setPreset(event.target.value as ThemeName)}>
          <option value="light">Light</option>
          <option value="ash">Ash</option>
          <option value="dark">Dark</option>
        </select>
      </label>
      <DiscordUI theme={preset} locale="en-US" timeZone="UTC"><Message message={message} /></DiscordUI>
      <DiscordUI theme={violet} locale="en-US" timeZone="UTC"><Message message={message} /></DiscordUI>
    </div>
  );
}
