import type { ThreadSummaryView } from "@arcscord/discord-ui-core";
import type { UserInteractionHandlers } from "../../interactions";
import { formatDiscordTimestamp, parseTimestamp } from "@arcscord/discord-ui-core";
import { useId } from "react";
import { Author } from "../author/author";
import { Avatar } from "../author/avatar";
import { useDisplayOptions } from "../display-context";

export type ThreadPreviewProps = UserInteractionHandlers & {
  thread: ThreadSummaryView;
  onOpen?: ((id: string) => void) | undefined;
  active?: boolean | undefined;
};

export function ThreadPreview({ thread, onOpen, active = false, ...handlers }: ThreadPreviewProps) {
  const { locale, timeZone, referenceTime, labels } = useDisplayOptions();
  const descriptionId = useId();
  const count = new Intl.NumberFormat(locale).format(thread.messageCount);
  const countLabel = (new Intl.PluralRules(locale).select(thread.messageCount) === "one"
    ? labels.threadMessageSingular
    : labels.threadMessagePlural).replace("{count}", count);
  const last = thread.lastMessage;
  const lastDate = last && parseTimestamp(last.timestamp);
  const time = last && lastDate
    ? formatDiscordTimestamp(String(lastDate.valueOf() / 1000), "R", {
        locale,
        timeZone,
        referenceTime: referenceTime ?? last.timestamp,
        relativeStyle: "narrow",
      })
    : undefined;
  const authorInteractive = Boolean(handlers.onUserClick || handlers.onUserContextMenu);
  const wrapperOpens = Boolean(onOpen && !authorInteractive);
  const headerOpens = Boolean(onOpen && authorInteractive);
  const Wrapper = wrapperOpens ? "button" : "div";
  const Header = headerOpens ? "button" : "span";
  const openLabel = `${labels.openThread} ${thread.name}, ${countLabel}`;
  return (
    <Wrapper
      className="dui-thread-preview"
      type={wrapperOpens ? "button" : undefined}
      onClick={wrapperOpens
        ? () => onOpen?.(thread.id)
        : undefined}
      aria-label={wrapperOpens
        ? openLabel
        : undefined}
      aria-describedby={wrapperOpens ? descriptionId : undefined}
      aria-expanded={wrapperOpens ? active : undefined}
    >
      <Header
        className={`dui-thread-preview-header${headerOpens ? " dui-thread-open" : ""}`}
        type={headerOpens ? "button" : undefined}
        onClick={headerOpens
          ? () => onOpen?.(thread.id)
          : undefined}
        aria-label={headerOpens ? openLabel : undefined}
        aria-describedby={headerOpens ? descriptionId : undefined}
        aria-expanded={headerOpens ? active : undefined}
      >
        <span className="dui-thread-name" title={thread.name}>{thread.name}</span>
        <span className="dui-thread-count">
          {countLabel}
          {onOpen
            ? <span aria-hidden="true"> ›</span>
            : null}
        </span>
      </Header>
      <span className="dui-thread-last" id={descriptionId}>
        {last
          ? (
              <>
                <Avatar author={last.author} tabIndex={-1} {...handlers} />
                <span className="dui-thread-last-author"><Author author={last.author} {...handlers} /></span>
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
