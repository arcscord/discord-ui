import type { ChannelViewModel } from "@arcscord/discord-ui";

export const demoChannel: ChannelViewModel = {
  id: "channel-exemple",
  name: "exemple",
  topic: "Messages, médias et composants React",
  messages: [
    {
      id: "channel-1",
      author: {
        id: "chris",
        displayName: "Chris",
        color: "#57bfa0",
        avatarFallback: { background: "#337c96", letter: "C" },
      },
      timestamp: "2026-10-28T17:30:00Z",
      body: { kind: "markdown", content: "Bienvenue dans **#exemple** ! Ce salon réunit plusieurs messages dans une même vue." },
    },
    {
      id: "channel-2",
      author: {
        id: "arcscord",
        displayName: "Arcscord",
        bot: true,
        verified: true,
        avatarUrl: "/generated/avatars/arcscord.svg",
        color: "#8ea1e1",
      },
      timestamp: "2026-10-29T18:00:00Z",
      body: { kind: "text", content: "Le header et la zone de saisie restent en place pendant le défilement." },
    },
    {
      id: "channel-3",
      reactions: [
        {
          id: "like",
          emoji: { name: "👍" },
          count: 4,
        },
      ],
      thread: {
        id: "thread-landscape",
        name: "paysage",
        messageCount: 1,
        lastMessage: {
          author: {
            id: "helper-bot",
            displayName: "Helper Bot",
            bot: true,
            verified: true,
            avatarUrl: "/generated/avatars/helper-bot.svg",
          },
          content: "This thread was created automatically.",
          timestamp: "2026-10-29T18:03:00Z",
        },
      },
      author: {
        id: "chris",
        displayName: "Chris",
        color: "#57bfa0",
        avatarFallback: { background: "#337c96", letter: "C" },
      },
      timestamp: "2026-10-29T18:01:00Z",
      body: { kind: "markdown", content: "Voici une image de démonstration :" },
      media: [
        {
          id: "channel-image",
          url: "/landscape.svg",
          alt: "Paysage de démonstration dans le salon",
          width: 600,
          height: 320,
        },
      ],
    },
    {
      id: "channel-4",
      reply: {
        messageId: "channel-3",
        author: { id: "chris", displayName: "Chris", color: "#57bfa0" },
        content: "Voici une image de démonstration :",
      },
      editedTimestamp: "2026-10-29T18:04:00Z",
      attachments: [
        {
          id: "guide",
          kind: "file",
          name: "guide.pdf",
          url: "https://example.com/guide.pdf",
          size: "24 KB",
        },
      ],
      author: { id: "ines", displayName: "Inès", color: "#b387df" },
      timestamp: "2026-10-29T18:02:00Z",
      body: { kind: "markdown", content: "Le JSON permet d’ajouter ou de modifier les messages. Essayez aussi la saisie en bas !" },
    },
  ],
  threads: [
    {
      id: "thread-landscape",
      name: "paysage",
      parentMessageId: "channel-3",
      messages: [
        {
          id: "thread-reply-1",
          reactions: [
            {
              id: "heart",
              emoji: { name: "❤️" },
              count: 2,
            },
          ],
          author: {
            id: "helper-bot",
            displayName: "Helper Bot",
            bot: true,
            verified: true,
            avatarUrl: "/generated/avatars/helper-bot.svg",
          },
          timestamp: "2026-10-29T18:03:00Z",
          body: { kind: "text", content: "This thread was created automatically." },
        },
      ],
    },
  ],
};
