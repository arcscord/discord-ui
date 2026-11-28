import type { MessageEntities } from "./model/content";
import type { ThemeInput, ThemeOverrides } from "./themes";

export const defaultMediaLabels = {
  mediaPlay: "Play",
  mediaReplay: "Replay",
  mediaPause: "Pause",
  mediaSeek: "Playback position",
  mediaVolume: "Volume",
  mediaMute: "Mute",
  mediaUnmute: "Unmute",
  mediaFullscreen: "Fullscreen",
  mediaExitFullscreen: "Exit fullscreen",
  mediaPlaybackSpeed: "Playback speed",
  mediaLoading: "Loading media",
  mediaUnsupportedSticker: "Sticker format not supported",
};

export type UILabels = Partial<typeof defaultMediaLabels> & {
  /** Accessible fallback for application-defined channel types. */
  channel?: string;
  /** Accessible channel type names, keyed by numeric type or custom type name. */
  channelTypes?: Readonly<Record<string, string>>;
  selectPlaceholder?: string;
  channelSelectPlaceholder?: string;
  removeSelection?: string;
  selectNoResults?: string;
  selectNoOptions?: string;
  userOnline?: string;
  userIdle?: string;
  userDnd?: string;
  userOffline?: string;
  commandOptions: string;
  commandReady: string;
  removeArgument: string;
  slashCommands: string;
  cancelCommand: string;
  chooseValue: string;
  edited: string;
  reply: string;
  replyUnavailable: string;
  interactionReply: string;
  interactionUsed: string;
  mentionedMessage?: string;
  ephemeralNotice: string;
  dismissMessage: string;
  downloadFile: string;
  reactions: string;
  thread: string;
  openThread: string;
  closeThread: string;
  threadMessageSingular: string;
  threadMessagePlural: string;
  threadNoRecentMessages: string;
  messages: string;
  emptyChannel: string;
  messagePlaceholder: string;
  sendMessage: string;
  spoiler: string;
  showSpoiler: string;
  hideSpoiler: string;
  mediaUnavailable: string;
  invalidTimestamp: string;
};
/** Twemoji files are served as `${baseUrl}/${codepoints}.svg`; no CDN is implicit. */
export type UnicodeEmojiOptions = { mode: "native" } | { mode: "twemoji"; baseUrl: string };

export type BaseDisplayOptions = {
  theme: ThemeInput;
  tokens?: ThemeOverrides;
  locale: string;
  timeZone: string;
  referenceTime?: string;
  entities: MessageEntities;
  allowRemoteMedia: boolean;
  /** HTTP(S) origins, directories or exact paths allowed when remote media is disabled. */
  remoteMediaAllowlist?: readonly string[];
  unicodeEmoji?: UnicodeEmojiOptions;
  labels: UILabels;
};

export const defaultDisplayOptions: BaseDisplayOptions = {
  theme: "dark",
  locale: "en-US",
  timeZone: "UTC",
  // Standalone Markdown also has a deterministic fallback; Message uses its timestamp.
  entities: {},
  allowRemoteMedia: true,
  unicodeEmoji: { mode: "native" },
  labels: {
    channel: "Channel",
    channelTypes: {
      0: "Text channel",
      1: "Direct message",
      2: "Voice channel",
      3: "Group direct message",
      4: "Category",
      5: "Announcement channel",
      10: "Announcement thread",
      11: "Public thread",
      12: "Private thread",
      13: "Stage channel",
      14: "Directory channel",
      15: "Forum channel",
      16: "Media channel",
    },
    ...defaultMediaLabels,
    selectPlaceholder: "Make a selection",
    channelSelectPlaceholder: "Select a channel",
    removeSelection: "Remove {name}",
    selectNoResults: "No results found",
    selectNoOptions: "No options available",
    userOnline: "online",
    userIdle: "idle",
    userDnd: "dnd",
    userOffline: "offline",
    commandOptions: "Options",
    commandReady: "Ready",
    removeArgument: "Remove argument",
    slashCommands: "Slash commands",
    cancelCommand: "Cancel command",
    chooseValue: "Choose a value",
    edited: "(edited)",
    reply: "Reply to",
    replyUnavailable: "Original message unavailable",
    interactionReply: "Interaction response",
    interactionUsed: "used",
    mentionedMessage: "Mentioned message",
    ephemeralNotice: "Only you can see this",
    dismissMessage: "Dismiss message",
    downloadFile: "Download {name}",
    reactions: "Reactions",
    thread: "Thread",
    openThread: "Open thread",
    closeThread: "Close thread",
    threadMessageSingular: "{count} message",
    threadMessagePlural: "{count} messages",
    threadNoRecentMessages: "No recent messages in this thread.",
    messages: "Messages",
    emptyChannel: "No messages yet.",
    messagePlaceholder: "Message #{channel}",
    sendMessage: "Send message",
    spoiler: "Spoiler",
    showSpoiler: "Reveal spoiler",
    hideSpoiler: "Hide spoiler",
    mediaUnavailable: "Media unavailable",
    invalidTimestamp: "Invalid timestamp",
  },
};
