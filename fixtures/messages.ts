import type { MessageView } from "@arcscord/discord-ui";

export const basicMessage: MessageView = {
  id: "message-welcome",
  author: {
    id: "author-arcscord",
    displayName: "Arcscord",
    bot: true,
    verified: true,
    color: "#8ea1e1",
  },
  timestamp: "2026-10-29T18:00:00Z",
  body: { kind: "text", content: "Bienvenue dans le playground !\nComposez votre premier message Discord avec des composants React indépendants." },
};
