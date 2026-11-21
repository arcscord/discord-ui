import type { ChannelViewModel, MessageEntities, MessageView, SelectValues, ThemeName, ThreadMessageView, UILabels } from "@arcscord/discord-ui-core";
import { defineTheme } from "@arcscord/discord-ui-core";

export const referenceTime = "2026-11-01T10:25:00Z";
export const timeZone = "UTC";
const author = { id: "guide", displayName: "Field Guide", avatarUrl: "/generated/avatars/ines.svg" };

export const classicMessage: MessageView = {
  id: "classic",
  author,
  timestamp: "2026-11-01T10:24:00Z",
  edited: true,
  body: { kind: "markdown", content: "**Trail notes**\n\nBring a map, keep the group together and reveal ||the meeting point||." },
  reactions: [
    {
      id: "wave",
      emoji: { name: "👋" },
      count: 1,
      me: false,
    },
  ],
};

export const classicExtras: MessageView[] = [
  {
    id: "classic-bot",
    author: {
      id: "bot",
      displayName: "Route Bot",
      bot: true,
      verified: true,
    },
    timestamp: "2026-11-01T10:24:00Z",
    reply: { messageId: "missing", unavailable: true },
    body: { kind: "text", content: "The original message is unavailable." },
  },
  {
    id: "classic-private",
    author: { id: "guide", displayName: "Field Guide" },
    timestamp: "2026-11-01T10:24:00Z",
    ephemeral: true,
    body: { kind: "text", content: "Only you can see this message." },
  },
];

export const interactionMessage: MessageView = {
  id: "poll",
  author,
  timestamp: "2026-11-01T10:24:00Z",
  body: {
    kind: "components-v2",
    components: [
      {
        id: "card",
        kind: "container",
        accentColor: "#5865f2",
        components: [
          { id: "summary", kind: "text-display", content: "**Plan the next walk**\nChoose up to two topics, then send a wave." },
          {
            id: "section",
            kind: "section",
            components: [
              { id: "section-text", kind: "text-display", content: "Explore the route" },
            ],
            accessory: { id: "section-button", kind: "button", label: "Details" },
          },
          {
            id: "separator",
            kind: "separator",
            divider: true,
            spacing: "small",
          },
          {
            id: "topics-row",
            kind: "action-row",
            select: {
              id: "topics",
              kind: "string-select",
              placeholder: "Choose topics",
              minValues: 0,
              maxValues: 2,
              options: [
                { value: "maps", label: "Maps" },
                { value: "gear", label: "Gear" },
              ],
            },
          },
          {
            id: "wave-row",
            kind: "action-row",
            buttons: [
              { id: "wave", kind: "button", label: "Wave" },
              {
                id: "disabled",
                kind: "button",
                label: "Unavailable",
                disabled: true,
              },
            ],
          },
        ],
      },
    ],
  },
};

export const initialChannel: ChannelViewModel = {
  id: "trail",
  name: "trail",
  topic: "Local comparison conversation",
  messages: [
    {
      id: "starter",
      author,
      timestamp: "2026-11-01T10:24:00Z",
      body: { kind: "text", content: "Open the thread or send a message." },
      thread: { id: "discussion", name: "Route planning", messageCount: 0 },
    },
  ],
  threads: [
    {
      id: "discussion",
      name: "Route planning",
      parentMessageId: "starter",
      messages: [],
    },
  ],
};

const base = { author, timestamp: "2026-11-01T10:24:00Z" };
const user = { id: "user-1", displayName: "Ari", entityType: "user" as const };
const role = { id: "role-1", name: "Guides", entityType: "role" as const };
const channel = {
  id: "channel-1",
  name: "routes",
  channelType: 0 as const,
  entityType: "channel" as const,
};
export const scenarioMessages: Record<string, MessageView> = {
  "markdown": {
    ...base,
    id: "markdown",
    body: { kind: "markdown", content: "**Bold and *nested italic***\n\n> A quoted trail\n\n- First stop\n- Second stop\n\n`inline code` and [map](https://example.com/map)\n\n<t:1793528640:F> <@123456789012345678>\n\n```js\nconst route = 12;\n```" },
  },
  "embeds": {
    ...base,
    id: "embeds",
    body: { kind: "text", content: "Route details" },
    embeds: [
      {
        id: "route",
        title: "A long route through the hills",
        description: "Follow the winding path and bring enough water for the entire group.",
        thumbnail: { id: "thumb", url: "/generated/avatars/ines.svg", alt: "Route thumbnail" },
        fields: [
          {
            id: "distance",
            name: "Distance",
            value: "12 kilometers",
            inline: true,
          },
          {
            id: "terrain",
            name: "Terrain",
            value: "A long description that wraps naturally across narrower previews.",
            inline: true,
          },
        ],
        footer: { text: "Field guide" },
      },
    ],
  },
  "media": {
    ...base,
    id: "media",
    body: { kind: "text", content: "Media and files" },
    media: [
      {
        id: "local",
        url: "/generated/avatars/ines.svg",
        alt: "Local image",
        width: 120,
        height: 120,
      },
      { id: "blocked", url: "https://example.com/blocked.png", alt: "Remote image" },
      { id: "allowed", url: "/generated/avatars/ines.svg", alt: "Allowlisted image" },
      { id: "failed", url: "/generated/avatars/invalid.png", alt: "Missing image" },
      {
        id: "video",
        kind: "video",
        url: "/examples/trail.webm",
        posterUrl: "/examples/trail-poster.png",
        alt: "Trail preview",
        width: 240,
        height: 135,
      },
      {
        id: "blocked-video",
        kind: "video",
        url: "https://example.com/blocked.webm",
        alt: "Remote video",
      },
      {
        id: "hidden-video",
        kind: "video",
        url: "/examples/trail.webm",
        posterUrl: "/examples/trail-poster.png",
        alt: "Hidden trail preview",
        spoiler: true,
        width: 240,
        height: 135,
      },
    ],
    attachments: [
      {
        id: "file",
        kind: "file",
        name: "route.txt",
        url: "https://example.com/route.txt",
        size: "2 KB",
      },
      {
        id: "audio",
        kind: "audio",
        url: "/examples/trail.wav",
        name: "trail.wav",
        size: "47 KB",
        durationSeconds: 3,
      },
      {
        id: "voice",
        kind: "audio",
        url: "/examples/trail.wav",
        name: "Trail voice note",
        voice: true,
        durationSeconds: 3,
        waveform: Array.from({ length: 256 }, (_, index) => [0.2, 0.5, 0.8, 0.4, 0.9, 0.3, 0.6, 0.2][index % 8]!),
      },
      {
        id: "blocked-audio",
        kind: "audio",
        url: "https://example.com/blocked.wav",
        name: "Remote audio",
      },
    ],
    stickers: [
      {
        id: "apng",
        name: "APNG marker",
        format: "apng",
        url: "/examples/trail-sticker.apng",
      },
      {
        id: "marker",
        name: "Arcscord sticker",
        format: "png",
        url: "/examples/arcscord-sticker.png",
      },
      {
        id: "gif",
        name: "GIF marker",
        format: "gif",
        url: "/examples/trail-sticker.gif",
      },
      {
        id: "lottie",
        name: "Lottie marker",
        format: "lottie",
        url: "https://example.com/sticker.json",
      },
    ],
  },
  "spoilers": {
    ...base,
    id: "spoilers",
    body: { kind: "markdown", content: "Reveal ||the meeting point|| and ||the hidden route||." },
  },
  "buttons": {
    ...base,
    id: "buttons",
    body: {
      kind: "components-v2",
      components: [
        {
          id: "buttons-row",
          kind: "action-row",
          buttons: [
            { id: "action", kind: "button", label: "Take action" },
            {
              id: "disabled",
              kind: "button",
              label: "Unavailable",
              disabled: true,
            },
            {
              id: "link",
              kind: "link-button",
              label: "Open map",
              url: "https://example.com/map",
            },
            {
              id: "premium",
              kind: "premium-button",
              label: "Upgrade",
              skuId: "sku-1",
            },
          ],
        },
      ],
    },
  },
  "selects": {
    ...base,
    id: "selects",
    body: {
      kind: "components-v2",
      components: [
        {
          id: "string-row",
          kind: "action-row",
          select: {
            id: "string",
            kind: "string-select",
            placeholder: "Choose trail",
            minValues: 0,
            maxValues: 2,
            options: [
              { value: "maps", label: "Maps" },
              { value: "gear", label: "Gear" },
              { value: "water", label: "Water" },
            ],
          },
        },
        {
          id: "user-row",
          kind: "action-row",
          select: {
            id: "user",
            kind: "user-select",
            placeholder: "Choose user",
            minValues: 1,
            entities: [user],
          },
        },
        {
          id: "role-row",
          kind: "action-row",
          select: {
            id: "role",
            kind: "role-select",
            placeholder: "Choose role",
            entities: [role],
          },
        },
        {
          id: "mention-row",
          kind: "action-row",
          select: {
            id: "mention",
            kind: "mentionable-select",
            placeholder: "Choose mention",
            entities: [user, role],
          },
        },
        {
          id: "channel-row",
          kind: "action-row",
          select: {
            id: "channel",
            kind: "channel-select",
            placeholder: "Choose channel",
            entities: [channel],
          },
        },
      ],
    },
  },
  "selection-ownership": {
    ...base,
    id: "selection-ownership",
    body: {
      kind: "components-v2",
      components: [
        {
          id: "ownership-row",
          kind: "action-row",
          select: {
            id: "ownership",
            kind: "string-select",
            placeholder: "Choose ownership",
            minValues: 0,
            maxValues: 2,
            options: [
              { value: "maps", label: "Maps", default: true },
              { value: "gear", label: "Gear" },
            ],
          },
        },
      ],
    },
  },
  "reactions": {
    ...base,
    id: "reactions",
    body: { kind: "text", content: "React to the route" },
    reactions: [
      {
        id: "wave",
        emoji: { name: "👋" },
        count: 1,
        me: false,
      },
    ],
  },
};
export function scenarioMessage(id: string, state: LocalState, origin: string): MessageView {
  const message = scenarioMessages[id];
  if (id === "media" && message.body.kind !== "components-v2") {
    return {
      ...message,
      body: message.body,
      media: message.media?.map(item => item.id === "allowed"
        ? { ...item, url: `${origin}/generated/avatars/ines.svg` }
        : item) ?? [],
    };
  }
  if (id === "selection-ownership" && state.ownershipMode === 3 && message.body.kind === "components-v2") {
    return {
      id: "selection-ownership-alternate",
      author: message.author,
      timestamp: message.timestamp,
      body: {
        ...message.body,
        components: message.body.components.map(component => component.kind === "action-row" && component.select
          ? {
              ...component,
              select: { ...component.select, id: "ownership-alternate" },
            }
          : component),
      },
    };
  }
  if (id !== "selects" || !state.selectsDisabled || message.body.kind !== "components-v2")
    return message;
  return {
    id: message.id,
    author: message.author,
    timestamp: message.timestamp,
    body: {
      ...message.body,
      components: message.body.components.map(component => component.kind === "action-row" && component.select
        ? {
            ...component,
            select: { ...component.select, disabled: true },
          }
        : component),
    },
  };
}
export const commands = [
  {
    name: "route",
    description: "Plan a route",
    arguments: [
      { name: "destination", description: "Destination", required: true },
      {
        name: "pace",
        description: "Walking pace",
        choices: [
          { name: "Easy", value: "easy" },
          { name: "Fast", value: "fast" },
        ],
      },
    ],
  },
];

export const scenarios = [
  {
    id: "classic",
    title: "Classic message",
    description: "Markdown, edited timestamp, spoiler and controlled reaction.",
    checkpoints: ["The edited marker and one unselected wave reaction are visible.", "Reveal the spoiler with Enter and hide it again.", "Toggle the reaction to count 2 and pressed, then back to count 1."],
  },
  {
    id: "interactions",
    title: "Components V2",
    description: "Controlled multi-selection, button callbacks and a disabled action.",
    checkpoints: ["The selection is explicitly empty and Unavailable is disabled.", "Choose Maps with the keyboard. The callback identifies poll and topics.", "Wave emits one button-click identifying poll and wave and increments waves."],
  },
  {
    id: "channel",
    title: "Channel and thread",
    description: "Composer, controlled thread navigation and local replies.",
    checkpoints: ["The channel has one starter message and its thread is closed.", "Send a message with Enter. One send event and one message are added.", "Open Route planning, send a reply, close with Escape and restore opener focus."],
  },
  {
    id: "markdown",
    title: "Markdown",
    description: "Whitespace, nesting, links and timestamps.",
    checkpoints: ["Inspect formatted text and links."],
  },
  {
    id: "embeds",
    title: "Embeds",
    description: "Fields, thumbnail and wrapping.",
    checkpoints: ["Inspect route fields and thumbnail."],
  },
  {
    id: "media",
    title: "Media and files",
    description: "Images, video, audio, voice notes and stickers with local and blocked sources.",
    checkpoints: ["Inspect media fallbacks and file."],
  },
  {
    id: "spoilers",
    title: "Spoilers",
    description: "Reveal and hide spoilers.",
    checkpoints: ["Reveal and hide the meeting point with keyboard or pointer."],
  },
  {
    id: "buttons",
    title: "Buttons",
    description: "Action, disabled, link and premium variants.",
    checkpoints: ["Activate Take action and Upgrade; Unavailable stays disabled."],
  },
  {
    id: "selects",
    title: "Select menus",
    description: "Five menu kinds with resolved entities.",
    checkpoints: ["Open each menu and select an option."],
  },
  {
    id: "selection-ownership",
    title: "Selection ownership",
    description: "Default, controlled empty and external updates.",
    checkpoints: ["Change ownership through host controls."],
  },
  {
    id: "reactions",
    title: "Reactions",
    description: "Controlled reaction count and pressed state.",
    checkpoints: ["Toggle the wave reaction."],
  },
  {
    id: "threads-commands",
    title: "Threads and commands",
    description: "Thread navigation and slash command arguments.",
    checkpoints: ["Open the thread and submit a route command."],
  },
] as const;

export type ScenarioId = typeof scenarios[number]["id"];
export const frameworks = ["react", "vue", "svelte"] as const;
export type Framework = typeof frameworks[number];
export type ComparisonConfig = { scenario: ScenarioId; theme: ThemeName; locale: "en-US" | "fr-FR"; allowRemoteMedia: boolean; customTheme?: boolean };
export const defaultConfig: ComparisonConfig = {
  scenario: "classic",
  theme: "ash",
  locale: "en-US",
  allowRemoteMedia: false,
};
export type LocalState = { waves: number; reacted: boolean; selectValues: SelectValues; channel: ChannelViewModel; activeThreadId: string | null; ownershipMode: number; selectsDisabled: boolean; dismissed: boolean };
export function createLocalState(): LocalState {
  return {
    waves: 0,
    reacted: false,
    selectValues: { topics: [] },
    channel: structuredClone(initialChannel),
    activeThreadId: null,
    ownershipMode: 0,
    selectsDisabled: false,
    dismissed: false,
  };
}

/** Pure local simulation used by each native host's send callback. */
export function appendMessage(channel: ChannelViewModel, content: string, threadId?: string): ChannelViewModel {
  const messages = threadId
    ? channel.threads?.find(thread => thread.id === threadId)?.messages ?? []
    : channel.messages;
  const message: ThreadMessageView = {
    id: `${threadId ?? "channel"}-${messages.length}`,
    author: { id: "you", displayName: "You" },
    timestamp: referenceTime,
    body: { kind: "text", content },
  };
  if (!threadId) {
    return {
      ...channel,
      messages: [...messages, message],
    };
  }
  return {
    ...channel,
    threads: (channel.threads ?? []).map(thread => thread.id === threadId
      ? {
          ...thread,
          messages: [...thread.messages, message],
        }
      : thread),
    messages: channel.messages.map(entry => entry.thread?.id === threadId
      ? {
          ...entry,
          thread: {
            ...entry.thread,
            messageCount: messages.length + 1,
            lastMessage: { author: message.author, content, timestamp: referenceTime },
          },
        }
      : entry),
  };
}

export function displayOptions(config: ComparisonConfig, origin: string): {
  entities: MessageEntities;
  theme: ThemeName | ReturnType<typeof defineTheme>;
  locale: ComparisonConfig["locale"];
  allowRemoteMedia: boolean;
  remoteMediaAllowlist: readonly string[];
  timeZone: string;
  referenceTime: string;
  labels: Partial<UILabels>;
} {
  const labels: Partial<UILabels> = config.locale === "fr-FR"
    ? {
        edited: "(modifié)",
        showSpoiler: "Révéler le spoiler",
        hideSpoiler: "Masquer le spoiler",
        messages: "Messages",
        openThread: "Ouvrir le fil",
        closeThread: "Fermer le fil",
        sendMessage: "Envoyer le message",
        messagePlaceholder: "Message #{channel}",
      }
    : {};
  return {
    theme: config.customTheme
      ? defineTheme({
          name: "comparison-custom",
          extends: config.theme,
          tokens: { accent: "#a45de3" },
        })
      : config.theme,
    locale: config.locale,
    timeZone,
    referenceTime,
    allowRemoteMedia: config.allowRemoteMedia,
    entities: {
      users: {
        "123456789012345678": { name: "Ari" },
      },
    },
    remoteMediaAllowlist: config.scenario === "media"
      ? [`${origin}/generated/avatars/ines.svg`]
      : [],
    labels,
  };
}

export function parseConfig(params: URLSearchParams): { config: ComparisonConfig; fallback: boolean } {
  const config = { ...defaultConfig };
  const scenario = params.get("scenario");
  const theme = params.get("theme");
  const locale = params.get("locale");
  const media = params.get("media");
  if (params.get("customTheme") === "true")
    config.customTheme = true;
  if (scenarios.some(entry => entry.id === scenario))
    config.scenario = scenario as ScenarioId;
  if (theme === "light" || theme === "ash" || theme === "dark")
    config.theme = theme;
  if (locale === "en-US" || locale === "fr-FR")
    config.locale = locale;
  if (media === "allow")
    config.allowRemoteMedia = true;
  return {
    config,
    fallback: Boolean((scenario !== null && scenario !== config.scenario) || (theme !== null && theme !== config.theme) || (locale !== null && locale !== config.locale) || (media !== null && media !== "allow" && media !== "block") || (params.has("customTheme") && params.get("customTheme") !== "true" && params.get("customTheme") !== "false")),
  };
}
