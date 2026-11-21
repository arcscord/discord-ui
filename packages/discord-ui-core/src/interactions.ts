import type { MessageAuthor, MessageView } from "./model/message";

/** Display metadata for an identified mention. The host resolves additional data. */
export type MentionTarget = {
  id: string;
  kind: "user" | "role" | "channel" | "command";
  name: string;
  color?: string | undefined;
};

/** Optional host actions for an author's avatar and display name. */
export type UserInteractionHandlers<E> = {
  onUserClick?: ((author: MessageAuthor, event: E) => void) | undefined;
  onUserContextMenu?: ((author: MessageAuthor, event: E) => void) | undefined;
};

/** Identified mentions expose their display data without resolving users or roles. */
export type MentionInteractionHandlers<E> = {
  onMentionClick?: ((mention: MentionTarget, event: E) => void) | undefined;
  onMentionContextMenu?: ((mention: MentionTarget, event: E) => void) | undefined;
};

/** Host-owned utility actions, separate from Discord component interactions. */
export type MessageInteractionHandlers<E> = UserInteractionHandlers<E> & MentionInteractionHandlers<E> & {
  onMessageContextMenu?: ((message: MessageView, event: E) => void) | undefined;
};
