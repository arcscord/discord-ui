import type { MessageAuthor } from "@arcscord/discord-ui-core";
import type { UserInteractionHandlers } from "../../interactions";
import { Author } from "../author/author";
import { useDisplayOptions } from "../display-context";
import { MessageTimestamp } from "./message-timestamp";

export type MessageHeaderProps = UserInteractionHandlers & { author: MessageAuthor; timestamp: string; edited?: boolean | undefined };

export function MessageHeader({ author, timestamp, edited = false, ...handlers }: MessageHeaderProps) {
  const { labels } = useDisplayOptions();
  return (
    <header className="dui-message-header">
      <Author author={author} {...handlers} />
      <MessageTimestamp timestamp={timestamp} />
      {edited
        ? <span className="dui-message-edited">{labels.edited}</span>
        : null}
    </header>
  );
}
