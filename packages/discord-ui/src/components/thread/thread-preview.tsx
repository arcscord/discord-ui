import type { ThreadSummaryView } from "../../model/thread";
import { useId } from "react";
import { formatDiscordTimestamp } from "../../utils/timestamps";
import { Author } from "../author/author";
import { Avatar } from "../author/avatar";
import { useDisplayOptions } from "../display-context";

export type ThreadPreviewProps = {
  thread: ThreadSummaryView;
  onOpen?: ((id: string) => void) | undefined;
  active?: boolean | undefined;
};

export function ThreadPreview({ thread, onOpen, active = false }: ThreadPreviewProps) {
  const { locale, timeZone, referenceTime, labels } = useDisplayOptions();
  const descriptionId = useId();
  const count = new Intl.NumberFormat(locale).format(thread.messageCount);
  const countLabel = (new Intl.PluralRules(locale).select(thread.messageCount) === "one"
    ? labels.threadMessageSingular
    : labels.threadMessagePlural).replace("{count}", count);
  const last = thread.lastMessage;
  const lastDate = last
    ? new Date(last.timestamp)
    : undefined;
  const time = last && lastDate && /T.*(?:Z|[+-]\d{2}:\d{2})$/u.test(last.timestamp) && Number.isFinite(lastDate.valueOf())
    ? formatDiscordTimestamp(String(lastDate.valueOf() / 1000), "R", {
        locale,
        timeZone,
        referenceTime: referenceTime ?? last.timestamp,
        relativeStyle: "narrow",
      })
    : undefined;
  const Wrapper = onOpen ? "button" : "div";
  return (
    <Wrapper
      className="dui-thread-preview"
      type={onOpen ? "button" : undefined}
      onClick={onOpen
        ? () => onOpen(thread.id)
        : undefined}
      aria-label={onOpen
        ? `${labels.openThread} ${thread.name}, ${countLabel}`
        : undefined}
      aria-describedby={onOpen ? descriptionId : undefined}
      aria-expanded={onOpen ? active : undefined}
    >
      <span className="dui-thread-preview-header">
        <span className="dui-thread-name" title={thread.name}>{thread.name}</span>
        <span className="dui-thread-count">
          {countLabel}
          {onOpen
            ? <span aria-hidden="true"> ›</span>
            : null}
        </span>
      </span>
      <span className="dui-thread-last" id={descriptionId}>
        {last
          ? (
              <>
                <Avatar author={last.author} />
                <span className="dui-thread-last-author"><Author author={last.author} /></span>
                <span className="dui-thread-snippet" title={last.content}>{last.content}</span>
                {time
                  ? <time className="dui-thread-last-time" dateTime={time.dateTime}>{time.label}</time>
                  : null}
              </>
            )
          : <span className="dui-thread-snippet">{labels.threadNoRecentMessages}</span>}
      </span>
    </Wrapper>
  );
}
