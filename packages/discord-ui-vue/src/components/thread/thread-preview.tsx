import type { ThreadSummaryView, UserInteractionHandlers } from "@arcscord/discord-ui-core";
import { formatDiscordTimestamp, parseTimestamp } from "@arcscord/discord-ui-core";
import { h, useId } from "vue";
import { defineRenderer } from "../../rendering";
import { Author } from "../author/author";
import { Avatar } from "../author/avatar";

export type ThreadPreviewProps = UserInteractionHandlers<MouseEvent> & { thread: ThreadSummaryView; onOpen?: ((id: string) => void) | undefined; active?: boolean | undefined };
export type ThreadPreviewSlots = Record<string, never>;
export type ThreadPreviewEmits = import("../../public-component").EventsFromProps<ThreadPreviewProps>;
export const ThreadPreview = defineRenderer<ThreadPreviewProps, ThreadPreviewProps, ThreadPreviewSlots>("ThreadPreview", [
  "thread",
  "onOpen",
  "active",
  "onUserClick",
  "onUserContextMenu",
], [], (input, options) => {
  const descriptionId = useId();
  return () => {
    const { thread, onOpen, active, onUserClick, onUserContextMenu } = input();
    const userActions = Boolean(onUserClick || onUserContextMenu);
    const countLabel = (new Intl.PluralRules(options.locale).select(thread.messageCount) === "one"
      ? options.labels.threadMessageSingular
      : options.labels.threadMessagePlural).replace("{count}", new Intl.NumberFormat(options.locale).format(thread.messageCount));
    const last = thread.lastMessage;
    const date = last && parseTimestamp(last.timestamp);
    const time = last && date
      ? formatDiscordTimestamp(String(date.valueOf() / 1000), "R", {
          locale: options.locale,
          timeZone: options.timeZone,
          referenceTime: options.referenceTime ?? last.timestamp,
          relativeStyle: "narrow",
        })
      : undefined;
    const navigation = {
      "type": "button",
      "aria-label": `${options.labels.openThread} ${thread.name}, ${countLabel}`,
      "aria-describedby": descriptionId,
      "aria-expanded": Boolean(active),
      "onClick": () => onOpen?.(thread.id),
    };
    const header = (
      <>
        <span class="dui-thread-name" title={thread.name}>{thread.name}</span>
        <span class="dui-thread-count">
          {countLabel}
          {onOpen
            ? <span aria-hidden="true"> ›</span>
            : null}
        </span>
      </>
    );
    return h(onOpen && !userActions
      ? "button"
      : "div", {
      "class": "dui-thread-preview",
      "data-active": active || undefined,
      ...(onOpen && !userActions
        ? navigation
        : {}),
    }, [
      userActions && onOpen
        ? h("button", { ...navigation, class: "dui-thread-preview-header dui-thread-open" }, header)
        : <span class="dui-thread-preview-header">{header}</span>,
      <span id={descriptionId} class="dui-thread-last">
        {last
          ? (
              <>
                <Avatar author={last.author} tabIndex={-1} onUserClick={onUserClick} onUserContextMenu={onUserContextMenu} />
                <span class="dui-thread-last-author"><Author author={last.author} onUserClick={onUserClick} onUserContextMenu={onUserContextMenu} /></span>
                <span class="dui-thread-snippet" title={last.content}>{last.content}</span>
                {time
                  ? <time class="dui-thread-last-time" datetime={time.dateTime}>{time.label}</time>
                  : null}
              </>
            )
          : <span class="dui-thread-snippet">{options.labels.threadNoRecentMessages}</span>}
      </span>,
    ]);
  };
});
