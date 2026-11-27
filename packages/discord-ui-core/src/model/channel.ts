import type { MessageView } from "./message";
import type { ThreadView } from "./thread";

/** An ordered, serializable snapshot of a text channel, without transport state. */
export type ChannelViewModel = {
  id: string;
  name: string;
  topic?: string;
  messages: readonly MessageView[];
  threads?: readonly ThreadView[];
};

/** The kind of a listed channel: it only picks the leading symbol. */
export type ChannelKind = "text" | "voice" | "announcement" | "forum";

/** One sidebar row. */
export type ChannelListItemView = {
  id: string;
  name: string;
  /** Defaults to `text`. */
  kind?: ChannelKind;
  /** Dimmed, for channels the host wants to de-emphasise. */
  muted?: boolean;
  /** Short host-formatted marker shown after the name, such as an unread count. */
  badge?: string;
};

/** An ordered group of channels. Omit `name` for channels outside any category. */
export type ChannelCategoryView = {
  id: string;
  name?: string;
  channels: readonly ChannelListItemView[];
};
