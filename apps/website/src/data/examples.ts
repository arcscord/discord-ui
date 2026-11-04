import type { ChannelViewModel, MessageView } from "@arcscord/discord-ui";

export const timestamp = "2026-11-01T10:24:00Z";
export const welcome: MessageView = {
  id: "welcome",
  reactions: [
    {
      id: "wave",
      emoji: { name: "👋" },
      count: 8,
    },
    {
      id: "heart",
      emoji: { name: "❤️" },
      count: 3,
      me: true,
    },
  ],
  author: {
    id: "welcome-bot",
    displayName: "Arcscord",
    bot: true,
    avatarUrl: "/generated/avatars/arcscord.svg",
    color: "#a7a9ff",
  },
  timestamp,
  body: { kind: "markdown", content: "## Welcome to the community, <@123456789012345678>!\nYour next great conversation starts here.\n\n> ||This is a spoiler — click to reveal.||" },
};
export const release: MessageView = {
  id: "release",
  reactions: [
    {
      id: "fire",
      emoji: { name: "🔥" },
      count: 12,
    },
    {
      id: "eyes",
      emoji: { name: "👀" },
      count: 4,
      me: true,
    },
    {
      id: "arc",
      emoji: { name: "arc", image: "/examples/emoji.svg" },
      count: 2,
    },
  ],
  author: {
    id: "release-bot",
    displayName: "Music Bot",
    bot: true,
    avatarUrl: "/generated/avatars/music-bot.svg",
    color: "#a7a9ff",
  },
  timestamp,
  body: { kind: "markdown", content: "A little update. A lot of possibilities." },
  embeds: [
    {
      id: "release-embed",
      title: "What's new",
      color: "#a7a9ff",
      description: "Build your next example with **rich messages**, channels and threads.",
      fields: [
        { id: "rendering", name: "Made for React", value: "Compose it. Render it. Make it yours." },
      ],
      footer: { text: "Example release announcement" },
    },
  ],
};
export const ticket: MessageView = {
  id: "ticket",
  author: {
    id: "support-bot",
    displayName: "Support Bot",
    bot: true,
    avatarUrl: "/generated/avatars/support-bot.svg",
    color: "#a7a9ff",
  },
  timestamp,
  body: {
    kind: "components-v2",
    components: [
      {
        id: "ticket-card",
        kind: "container",
        accentColor: "#a7a9ff",
        components: [
          { id: "ticket-title", kind: "text-display", content: "## A little help goes a long way.\nTell us what you're building. We'll help you get started." },
          { id: "divider", kind: "separator", divider: true },
          {
            id: "ticket-actions",
            kind: "action-row",
            buttons: [
              {
                id: "guide",
                kind: "link-button",
                label: "Read the guide",
                url: "https://ui.arcscord.dev/docs/introduction",
              },
            ],
          },
        ],
      },
    ],
  },
};
export const markdown: MessageView = {
  id: "markdown",
  author: {
    id: "support-bot",
    displayName: "Support Bot",
    bot: true,
    avatarUrl: "/generated/avatars/support-bot.svg",
    color: "#a7a9ff",
  },
  timestamp,
  body: { kind: "markdown", content: "**Welcome to the server, <@123456789012345678>!**\n\nWe're excited to have you here.\nHere's a quick tip: ||you can find the full guide in the server guide channel.||\n\nTo get started, try running:\n```bash\n/help\n```" },
};
export const initialChannel: ChannelViewModel = {
  id: "support",
  name: "support",
  topic: "A little help goes a long way.",
  messages: [
    {
      id: "question",
      author: {
        id: "ines",
        displayName: "Inès",
        color: "#57bfa0",
        avatarFallback: { background: "#337c96", letter: "A" },
      },
      timestamp: "2026-11-01T09:12:00Z",
      body: { kind: "text", content: "I'm having trouble getting the bot to respond. Any ideas?" },
    },
    {
      id: "answer",
      reactions: [
        {
          id: "like",
          emoji: { name: "👍" },
          count: 3,
        },
      ],
      author: ticket.author,
      timestamp: "2026-11-01T09:15:00Z",
      body: { kind: "markdown", content: "Check that your bot has permission to send messages in this channel. This conversation is a local demo; the [Discord UI docs](https://ui.arcscord.dev/docs/introduction) explain how to render it in React." },
    },
    {
      id: "starter",
      author: {
        id: "ines",
        displayName: "Inès",
        color: "#57bfa0",
        avatarFallback: { background: "#337c96", letter: "A" },
      },
      timestamp: "2026-11-01T09:18:00Z",
      body: { kind: "text", content: "That looks good, thanks! One more question — how do I configure welcome messages?" },
      thread: {
        id: "setup",
        name: "Setup help",
        messageCount: 3,
        lastMessage: {
          author: {
            id: "ines",
            displayName: "Inès",
            color: "#57bfa0",
            avatarFallback: { background: "#337c96", letter: "A" },
          },
          content: "Ah, that was it! It's working now. Thanks!",
          timestamp: "2026-11-01T09:28:00Z",
        },
      },
    },
  ],
  threads: [
    {
      id: "setup",
      name: "Setup help",
      parentMessageId: "starter",
      messages: [
        {
          id: "reply-1",
          author: {
            id: "ines",
            displayName: "Inès",
            color: "#57bfa0",
            avatarFallback: { background: "#337c96", letter: "A" },
          },
          timestamp: "2026-11-01T09:19:00Z",
          body: { kind: "markdown", content: "Here is my current configuration. Is anything missing?\n```json\n{\n  \"welcomeChannel\": \"123456789012345678\",\n  \"message\": \"Welcome!\"\n}\n```" },
        },
        {
          id: "reply-2",
          reactions: [
            {
              id: "heart",
              emoji: { name: "❤️" },
              count: 2,
            },
          ],
          author: ticket.author,
          timestamp: "2026-11-01T09:22:00Z",
          body: { kind: "text", content: "That looks correct. Make sure the bot also has the Send Messages permission in that channel." },
        },
        {
          id: "reply-3",
          author: {
            id: "ines",
            displayName: "Inès",
            color: "#57bfa0",
            avatarFallback: { background: "#337c96", letter: "A" },
          },
          timestamp: "2026-11-01T09:28:00Z",
          body: { kind: "text", content: "Ah, that was it! It's working now. Thanks!" },
        },
      ],
    },
  ],
};
