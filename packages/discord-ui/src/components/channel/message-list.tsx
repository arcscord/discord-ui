import type { MessageView } from "../../model/message";
import { useDisplayOptions } from "../display-context";
import { Message } from "../message/message";

export type MessageListProps = { messages: readonly MessageView[]; showDateSeparators?: boolean; showThreadPreviews?: boolean | undefined; onThreadOpen?: ((id: string) => void) | undefined; activeThreadId?: string | undefined; availableThreadIds?: readonly string[] | undefined };

export function MessageList({ messages, showDateSeparators = true, showThreadPreviews = true, onThreadOpen, activeThreadId, availableThreadIds }: MessageListProps) {
  const { locale, timeZone, labels } = useDisplayOptions();
  const keyFormat = new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone,
  });
  const labelFormat = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone });
  let previousDate: string | undefined;
  if (!messages.length)
    return <p className="dui-channel-empty">{labels.emptyChannel}</p>;
  return (
    <ol className="dui-message-list" aria-label={labels.messages}>
      {messages.map((message) => {
        const date = new Date(message.timestamp);
        const validDate = /T.*(?:Z|[+-]\d{2}:\d{2})$/u.test(message.timestamp) && Number.isFinite(date.valueOf());
        const parts = validDate
          ? keyFormat.formatToParts(date)
          : [];
        const dateKey = validDate
          ? ["year", "month", "day"].map(type => parts.find(part => part.type === type)?.value).join("-")
          : undefined;
        const showDate = showDateSeparators && dateKey !== undefined && dateKey !== previousDate;
        previousDate = dateKey;
        return (
          <li key={message.id} className="dui-message-list-item">
            {showDate
              ? <div className="dui-date-separator"><time dateTime={dateKey}>{labelFormat.format(date)}</time></div>
              : null}
            <Message
              message={message}
              showThreadPreview={showThreadPreviews}
              onThreadOpen={message.thread && (!availableThreadIds || availableThreadIds.includes(message.thread.id))
                ? onThreadOpen
                : undefined}
              activeThreadId={activeThreadId}
            />
          </li>
        );
      })}
    </ol>
  );
}
