import type { MessageView } from "./message";
import type { ThreadView } from "./thread";

/** An ordered, serializable snapshot of a text channel, without transport state. */
export type ChannelViewModel = {
  id: string;
  name: string;
  topic?: string;
  messages: MessageView[];
  threads?: ThreadView[];
};
