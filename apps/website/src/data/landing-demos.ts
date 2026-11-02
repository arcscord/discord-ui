import type { ChannelViewModel, MessageAuthor, MessageView, SlashCommand } from "@arcscord/discord-ui";

export const demoTime = "2026-11-01T10:00:00Z";
export const demoBot: MessageAuthor = {
  id: "demo-bot",
  displayName: "Arcade",
  bot: true,
  color: "#a7a9ff",
  avatarFallback: { background: "#6055a8", letter: "A" },
};
export const demoUser: MessageAuthor = {
  id: "demo-you",
  displayName: "You",
  color: "#e4a44b",
  avatarFallback: { background: "#98601d", letter: "Y" },
};
const ines: MessageAuthor = {
  id: "ines",
  displayName: "Inès",
  color: "#57bfa0",
  avatarFallback: { background: "#337c96", letter: "I" },
};
const support: MessageAuthor = {
  id: "alex",
  displayName: "Alex",
  color: "#a7a9ff",
  avatarFallback: { background: "#6055a8", letter: "A" },
};

export function createAnnouncement(origin: string): MessageView {
  return {
    id: "launch",
    author: { ...demoBot, displayName: "Community Bot" },
    timestamp: demoTime,
    body: {
      kind: "components-v2",
      components: [
        {
          id: "launch-card",
          kind: "container",
          accentColor: "#a7a9ff",
          components: [
            { id: "title", kind: "text-display", content: "## Your next adventure starts here.\nNew places. Familiar faces. A whole community to explore." },
            {
              id: "cover",
              kind: "media-gallery",
              items: [
                { id: "cover-image", url: "/examples/landscape.svg", alt: "An illustrated mountain landscape" },
              ],
            },
            { id: "details", kind: "text-display", content: "**Community night · Friday, 18:00 UTC**\nBring your friends. We’ll bring the quests." },
            {
              id: "actions",
              kind: "action-row",
              buttons: [
                {
                  id: "explore",
                  kind: "link-button",
                  label: "Build a message like this",
                  url: new URL("/playground?example=announcement", origin).href,
                },
              ],
            },
          ],
        },
      ],
    },
  };
}

export function createTranscript(origin: string): ChannelViewModel {
  return {
    id: "ticket-1042",
    name: "ticket-1042",
    topic: "Resolved · Welcome message setup",
    messages: [
      {
        id: "t1",
        author: ines,
        timestamp: "2026-11-01T09:12:00Z",
        body: { kind: "text", content: "Hi! My welcome message never appears when someone joins. Could you help?" },
      },
      {
        id: "t2",
        author: support,
        timestamp: "2026-11-01T09:13:00Z",
        reply: { messageId: "t1", author: ines, content: "My welcome message never appears when someone joins." },
        body: { kind: "text", content: "Of course. Which channel should it appear in?" },
      },
      {
        id: "t3",
        author: ines,
        timestamp: "2026-11-01T09:14:00Z",
        body: { kind: "text", content: "In #welcome. Here’s the configuration I’m using." },
        attachments: [
          {
            id: "config",
            kind: "file",
            name: "welcome-config.json",
            url: new URL("/examples/welcome-config.json", origin).href,
            size: "88 B",
          },
        ],
      },
      {
        id: "t4",
        author: support,
        timestamp: "2026-11-01T09:16:00Z",
        body: { kind: "markdown", content: "The config looks good. Let’s check the channel permissions together." },
        thread: {
          id: "permissions",
          name: "Permission check",
          messageCount: 2,
          lastMessage: { author: ines, timestamp: "2026-11-01T09:19:00Z", content: "Send Messages was disabled. Fixed!" },
        },
      },
      {
        id: "t5",
        author: ines,
        timestamp: "2026-11-01T09:20:00Z",
        edited: true,
        body: { kind: "text", content: "It works! The first welcome just came through. Thanks for the quick help." },
      },
      {
        id: "t6",
        author: support,
        timestamp: "2026-11-01T09:21:00Z",
        body: { kind: "markdown", content: "**All sorted.** I’ve marked this ticket as resolved. Have a great community launch!" },
        reactions: [
          {
            id: "thanks",
            emoji: { name: "💜" },
            count: 1,
          },
        ],
      },
    ],
    threads: [
      {
        id: "permissions",
        name: "Permission check",
        parentMessageId: "t4",
        messages: [
          {
            id: "p1",
            author: support,
            timestamp: "2026-11-01T09:17:00Z",
            body: { kind: "markdown", content: "Open **#welcome → Permissions** and check that the bot can **View Channel** and **Send Messages**." },
          },
          {
            id: "p2",
            author: ines,
            timestamp: "2026-11-01T09:19:00Z",
            body: { kind: "text", content: "Send Messages was disabled. Fixed!" },
          },
        ],
      },
    ],
  };
}

export const arcadeCommands: SlashCommand[] = [
  {
    name: "dice",
    description: "Roll a die. How lucky are you?",
    application: "Arcade",
    arguments: [
      {
        name: "faces",
        description: "Choose your die (default: 6)",
        choices: [6, 12, 20].map(faces => ({
          name: `${faces} sides`,
          value: String(faces),
        })),
      },
    ],
  },
  {
    name: "quiz",
    description: "One question. Three answers. Your move.",
    application: "Arcade",
    arguments: [
      {
        name: "category",
        description: "Choose a category (default: gaming)",
        choices: [
          { name: "Gaming", value: "gaming" },
          { name: "Space", value: "space" },
        ],
      },
    ],
  },
  {
    name: "8ball",
    description: "Ask a question. Consult the magic eight ball.",
    application: "Arcade",
    arguments: [
      { name: "question", description: "What would you like to know?", required: true },
    ],
  },
];
export const arcadeChannel: ChannelViewModel = {
  id: "arcade",
  name: "bot-playground",
  topic: "Three commands. A few little surprises.",
  messages: [
    {
      id: "intro",
      author: demoBot,
      timestamp: demoTime,
      body: { kind: "markdown", content: "## Ready to play?\nType `/` below to roll a die, try a quiz or ask the magic eight ball.\n\nPick a shortcut above if you need a starting point." },
    },
  ],
};
