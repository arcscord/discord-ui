import type { MessageAuthor } from "../../model/message";
import { Author } from "../author/author";
import { useDisplayOptions } from "../display-context";
import { MessageTimestamp } from "./message-timestamp";

export function MessageHeader({ author, timestamp, edited, editedTimestamp }: { author: MessageAuthor; timestamp: string; edited?: boolean | undefined; editedTimestamp?: string | undefined }) {
  const { labels } = useDisplayOptions();
  return (
    <header className="dui-message-header">
      <Author author={author} />
      <MessageTimestamp timestamp={timestamp} />
      {edited || editedTimestamp
        ? (
            <span className="dui-message-edited">
              {editedTimestamp
                ? <MessageTimestamp timestamp={editedTimestamp} label={labels.edited} />
                : labels.edited}
            </span>
          )
        : null}
    </header>
  );
}
