import type { MessageAuthor, MessageContentView, MessageMetadata } from "./message";

/** A thread summary never embeds its conversation recursively. */
export type ThreadSummaryView = {
  id: string;
  name: string;
  messageCount: number;
  lastMessage?: { author: MessageAuthor; content: string; timestamp: string };
};

export type ThreadMessageView = MessageMetadata & MessageContentView & { thread?: never };
export type ThreadView = {
  id: string;
  name: string;
  parentMessageId: string;
  /** Replies only; the starter remains in the channel's messages. */
  messages: ThreadMessageView[];
};
