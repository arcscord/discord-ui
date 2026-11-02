import type { ActionRowView, ComponentsV2Body, FileView } from "./components";
import type { EmbedView, MarkdownMessageBody, MediaView } from "./content";
import type { ReactionView } from "./reaction";
import type { ThreadSummaryView } from "./thread";

/** Colors use six-digit hex values; omitted values are generated from the author. */
export type AvatarFallback = {
  background?: string;
  letter?: string;
  color?: string;
};

/** Display metadata supplied by the application, without Discord API calls. */
export type MessageAuthor = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  avatarFallback?: AvatarFallback;
  bot?: boolean;
  verified?: boolean;
  color?: string;
};

/** Plain text is the first supported body; richer variants will extend this union. */
export type TextMessageBody = {
  kind: "text";
  content: string;
};

/** A resolved, plain-text reply snapshot, or an unavailable original message. */
export type MessageReplyView = { kind?: "message"; messageId: string } & (
  | { unavailable: true; author?: never; content?: never }
  | { unavailable?: false; author: MessageAuthor; content: string }
);

/** The invoking user and slash command, supplied by the host application. */
export type InteractionReplyView = {
  kind: "interaction";
  author: MessageAuthor;
  /** Command name without the leading slash; may include a subcommand. */
  commandName: string;
};

export type ReplyView = MessageReplyView | InteractionReplyView;

/** Serializable display data. This is not a Discord send-payload validator. */
export type MessageMetadata = {
  id: string;
  author: MessageAuthor;
  /** Explicit ISO 8601 timestamp including a timezone; no implicit local clock. */
  timestamp: string;
  reactions?: ReactionView[];
  reply?: ReplyView;
  /** Shows the edited marker; omitted is equivalent to false. */
  edited?: boolean;
  /** Display-only visibility hint. The host controls access to private data. */
  ephemeral?: boolean;
};

export type MessageContentView = (
  | { body: TextMessageBody | MarkdownMessageBody; media?: MediaView[]; attachments?: FileView[]; embeds?: EmbedView[]; components?: ActionRowView[] }
  | { body: ComponentsV2Body; media?: never; attachments?: never; embeds?: never; components?: never }
);

export type MessageView = MessageMetadata & MessageContentView & { thread?: ThreadSummaryView };
