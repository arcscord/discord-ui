import type { MessageView } from "../../model/message";
import { Avatar } from "../author/avatar";
import { MessageContent } from "./message-content";
import { MessageFrame } from "./message-frame";
import { MessageHeader } from "./message-header";

export function Message({ message }: { message: MessageView }) {
  return (
    <MessageFrame avatar={<Avatar author={message.author} />} header={<MessageHeader author={message.author} timestamp={message.timestamp} />}>
      <MessageContent content={message.body.content} />
    </MessageFrame>
  );
}
