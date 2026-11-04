import type { MessageView } from "@arcscord/discord-ui";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

const author = { id: "guide-bot", displayName: "Guide Bot", bot: true };
const timestamp = "2026-11-01T10:24:00Z";

const message: MessageView = {
  id: "bonjour",
  author,
  timestamp,
  edited: true,
  body: { kind: "markdown", content: "Bonjour ! ||Un détail masqué|| <t:1793528640:R>" },
};
export default function Localization(): React.ReactElement {
  return (
    <DiscordUI
      theme="light"
      locale="fr-CH"
      timeZone="Europe/Zurich"
      referenceTime="2026-11-01T11:24:00Z"
      labels={{ edited: "(modifié)", showSpoiler: "Révéler le contenu", hideSpoiler: "Masquer le contenu" }}
    >
      <Message message={message} />
    </DiscordUI>
  );
}
