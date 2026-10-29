import type { MessageAuthor } from "../../model/message";
import { Author } from "../author/author";
import { MessageTimestamp } from "./message-timestamp";

export function MessageHeader({ author, timestamp }: { author: MessageAuthor; timestamp: string }) {
  return (
    <header className="dui-message-header">
      <Author author={author} />
      <MessageTimestamp timestamp={timestamp} />
    </header>
  );
}
