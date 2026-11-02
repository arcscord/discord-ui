import type { MessageAuthor } from "../../model/message";
import { Author } from "../author/author";
import { useDisplayOptions } from "../display-context";
import { MessageTimestamp } from "./message-timestamp";

export function MessageHeader({ author, timestamp, edited = false }: { author: MessageAuthor; timestamp: string; edited?: boolean | undefined }) {
  const { labels } = useDisplayOptions();
  return (
    <header className="dui-message-header">
      <Author author={author} />
      <MessageTimestamp timestamp={timestamp} />
      {edited
        ? <span className="dui-message-edited">{labels.edited}</span>
        : null}
    </header>
  );
}
