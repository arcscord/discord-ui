// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { defineRenderer } from "../../rendering";
import { UnicodeEmoji } from "../content/unicode-emoji";

type MessageContentPropsInput = {
  content: string;
};
export type MessageContentProps = MessageContentPropsInput;
export type MessageContentSlots = Record<string, never>;
export const MessageContent = defineRenderer<MessageContentProps, MessageContentPropsInput, MessageContentSlots>("MessageContent", ["content"], [], (input, _display) => {
  return () => {
    const { content } = input(true);

    return <div class="dui-message-text"><UnicodeEmoji content={content} /></div>;
  };
});
export type MessageContentEmits = Record<string, never>;
