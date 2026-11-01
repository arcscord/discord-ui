import type { ChannelViewModel, MessageView, ThemeName } from "@arcscord/discord-ui";

export const timestamp = "2026-11-01T10:24:00Z";
export const welcome: MessageView = {
  id: "welcome",
  author: { id: "welcome-bot", displayName: "Welcome Bot", bot: true },
  timestamp,
  body: { kind: "markdown", content: "## Welcome to the community, <@123456789012345678>!\nYour next great conversation starts here.\n\n> ||This is a spoiler — click to reveal.||" },
};
export const release: MessageView = {
  id: "release",
  author: { id: "release-bot", displayName: "Release Bot", bot: true },
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
  author: { id: "support-bot", displayName: "Support Bot", bot: true },
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
  author: { id: "support-bot", displayName: "Support Bot", bot: true },
  timestamp,
  body: { kind: "markdown", content: "**Welcome to the server, <@123456789012345678>!**\n\nWe're excited to have you here.\nHere's a quick tip: ||you can find the full guide in the server guide channel.||\n\nTo get started, try running:\n```bash\n/help\n```" },
};
export const heroExamples = [
  { label: "Welcome bot", file: "welcome.tsx", message: welcome },
  { label: "Release notes", file: "release.tsx", message: release },
  { label: "Support ticket", file: "support.tsx", message: ticket },
];
export const richExamples = [
  { label: "Markdown", file: "markdown.tsx", message: markdown },
  { label: "Embeds", file: "embed.tsx", message: release },
  { label: "Components V2", file: "components.tsx", message: ticket },
];
export function messageSource(message: MessageView, theme: ThemeName): string {
  return `import type { MessageView } from "@arcscord/discord-ui";\nimport { DiscordUI, Message } from "@arcscord/discord-ui";\nimport "@arcscord/discord-ui/styles.css";\n\nconst message: MessageView = ${JSON.stringify(message, null, 2)};\n\nexport function Example() {\n  return (\n    <DiscordUI theme="${theme}" locale="en-US" timeZone="UTC"\n      entities={{ users: { "123456789012345678": { name: "Alex" } } }}>\n      <Message message={message} />\n    </DiscordUI>\n  );\n}`;
}
export const initialChannel: ChannelViewModel = {
  id: "support",
  name: "support",
  topic: "A little help goes a long way.",
  messages: [
    {
      id: "question",
      author: { id: "alex", displayName: "Alex" },
      timestamp: "2026-11-01T09:12:00Z",
      body: { kind: "text", content: "I'm having trouble getting the bot to respond. Any ideas?" },
    },
    {
      id: "answer",
      author: ticket.author,
      timestamp: "2026-11-01T09:15:00Z",
      body: { kind: "markdown", content: "Make sure you've added the bot to your server and granted the required permissions. You can also check out the [docs](https://ui.arcscord.dev/docs/introduction) for a full setup guide." },
    },
    {
      id: "starter",
      author: { id: "alex", displayName: "Alex" },
      timestamp: "2026-11-01T09:18:00Z",
      body: { kind: "text", content: "That looks good, thanks! One more question — how do I configure welcome messages?" },
      thread: {
        id: "setup",
        name: "Setup help",
        messageCount: 3,
        lastMessage: {
          author: { id: "alex", displayName: "Alex" },
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
          author: { id: "alex", displayName: "Alex" },
          timestamp: "2026-11-01T09:19:00Z",
          body: { kind: "markdown", content: "Here is my current configuration. Is anything missing?\n```json\n{\n  \"welcomeChannel\": \"123456789012345678\",\n  \"message\": \"Welcome!\"\n}\n```" },
        },
        {
          id: "reply-2",
          author: ticket.author,
          timestamp: "2026-11-01T09:22:00Z",
          body: { kind: "text", content: "That looks correct. Make sure the bot also has the Send Messages permission in that channel." },
        },
        {
          id: "reply-3",
          author: { id: "alex", displayName: "Alex" },
          timestamp: "2026-11-01T09:28:00Z",
          body: { kind: "text", content: "Ah, that was it! It's working now. Thanks!" },
        },
      ],
    },
  ],
};
