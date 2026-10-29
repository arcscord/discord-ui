/** Display metadata supplied by the application, without Discord API calls. */
export type MessageAuthor = {
  id: string;
  displayName: string;
  avatarUrl?: string;
  bot?: boolean;
};

/** Plain text is the first supported body; richer variants will extend this union. */
export type TextMessageBody = {
  kind: "text";
  content: string;
};

/** Serializable display data. This is not a Discord send-payload validator. */
export type MessageView = {
  id: string;
  author: MessageAuthor;
  /** Explicit ISO 8601 timestamp including a timezone; no implicit local clock. */
  timestamp: string;
  body: TextMessageBody;
};
