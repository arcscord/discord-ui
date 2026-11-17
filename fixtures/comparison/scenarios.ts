import type { ChannelViewModel, MessageView, SelectValues, ThemeName, ThreadMessageView, UILabels } from "@arcscord/discord-ui-core";

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
] as const;

export type ScenarioId = typeof scenarios[number]["id"];
export const frameworks = ["react", "vue", "svelte"] as const;
export type Framework = typeof frameworks[number];
export type ComparisonConfig = { scenario: ScenarioId; theme: ThemeName; locale: "en-US" | "fr-FR"; allowRemoteMedia: boolean };
export const defaultConfig: ComparisonConfig = {
  scenario: "classic",
  theme: "ash",
  locale: "en-US",
  allowRemoteMedia: false,
};
export type LocalState = { waves: number; reacted: boolean; selectValues: SelectValues; channel: ChannelViewModel; activeThreadId: string | null };
export function createLocalState(): LocalState {
  return {
    waves: 0,
    reacted: false,
    selectValues: { topics: [] },
    channel: structuredClone(initialChannel),
    activeThreadId: null,
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

export function displayOptions(config: ComparisonConfig): Pick<ComparisonConfig, "theme" | "locale" | "allowRemoteMedia"> & { timeZone: string; referenceTime: string; labels: Partial<UILabels> } {
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
    theme: config.theme,
    locale: config.locale,
    timeZone,
    referenceTime,
    allowRemoteMedia: config.allowRemoteMedia,
    labels,
  };
}

export function parseConfig(params: URLSearchParams): { config: ComparisonConfig; fallback: boolean } {
  const config = { ...defaultConfig };
  const scenario = params.get("scenario");
  const theme = params.get("theme");
  const locale = params.get("locale");
  const media = params.get("media");
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
    fallback: Boolean((scenario !== null && scenario !== config.scenario) || (theme !== null && theme !== config.theme) || (locale !== null && locale !== config.locale) || (media !== null && media !== "allow" && media !== "block")),
  };
}
