import type { MessageAuthor, UserInteractionHandlers } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { defineRenderer } from "../../rendering";
import { Author } from "../author/author";
import { MessageTimestamp } from "./message-timestamp";

type MessageHeaderPropsInput = UserInteractionHandlers<MouseEvent> & {
  author: MessageAuthor;
  timestamp: string;
  edited?: boolean | undefined;
};
export type MessageHeaderProps = MessageHeaderPropsInput;
export type MessageHeaderSlots = Record<string, never>;
export const MessageHeader = defineRenderer<MessageHeaderProps, MessageHeaderPropsInput, MessageHeaderSlots>("MessageHeader", [
  "onUserClick",
  "onUserContextMenu",
  "author",
  "timestamp",
  "edited",
], [], (input, display) => {
  return () => {
    const { author, onUserClick, onUserContextMenu, timestamp, edited = false } = input(true);
    const { labels } = display;
    return (
      <header class="dui-message-header">
        <Author onUserClick={onUserClick} onUserContextMenu={onUserContextMenu} author={author} />
        <MessageTimestamp timestamp={timestamp} />
        {edited
          ? <span class="dui-message-edited">{labels.edited}</span>
          : null}
      </header>
    );
  };
});
export type MessageHeaderEmits = import("../../public-component").EventsFromProps<UserInteractionHandlers<MouseEvent>>;
