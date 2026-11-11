import type { ComponentHandlers, MessageView, ReactionToggleHandler, SelectValuesByMessage } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { parseTimestamp } from "@arcscord/discord-ui-core";
import { defineRenderer } from "../../rendering";
import { Message } from "../message/message";

type MessageListPropsInput = ComponentHandlers & {
  selectValuesByMessage?: SelectValuesByMessage | undefined;
  onReactionToggle?: ReactionToggleHandler | undefined;
  onEphemeralDismiss?: ((messageId: string) => void) | undefined;
  messages: readonly MessageView[];
  showDateSeparators?: boolean;
  showThreadPreviews?: boolean | undefined;
  onThreadOpen?: ((id: string) => void) | undefined;
  activeThreadId?: string | undefined;
  availableThreadIds?: readonly string[] | undefined;
};
export type MessageListProps = MessageListPropsInput;
export type MessageListSlots = Record<string, never>;
export const MessageList = defineRenderer<MessageListProps, MessageListPropsInput, MessageListSlots>("MessageList", [
  "onButtonClick",
  "onSelectChange",
  "onPremiumClick",
  "selectValuesByMessage",
  "onReactionToggle",
  "onEphemeralDismiss",
  "messages",
  "showDateSeparators",
  "showThreadPreviews",
  "onThreadOpen",
  "activeThreadId",
  "availableThreadIds",
], [], (input, display) => {
  return () => {
    const { selectValuesByMessage, onEphemeralDismiss, onButtonClick, onSelectChange, onPremiumClick, messages, onReactionToggle, showDateSeparators = true, showThreadPreviews = true, onThreadOpen, activeThreadId, availableThreadIds } = input(true);
    const { locale, timeZone, labels } = display;
    const keyFormat = new Intl.DateTimeFormat("en-CA", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      timeZone,
    });
    const labelFormat = new Intl.DateTimeFormat(locale, { dateStyle: "long", timeZone });
    let previousDate: string | undefined;
    if (!messages.length)
      return <p class="dui-channel-empty">{labels.emptyChannel}</p>;
    return (
      <ol class="dui-message-list" aria-label={labels.messages}>
        {messages.map((message) => {
          const date = parseTimestamp(message.timestamp);
          const parts = date
            ? keyFormat.formatToParts(date)
            : [];
          const dateKey = date
            ? ["year", "month", "day"].map(type => parts.find(part => part.type === type)?.value).join("-")
            : undefined;
          const showDate = showDateSeparators && dateKey !== undefined && dateKey !== previousDate;
          previousDate = dateKey;
          return (
            <li key={message.id} class="dui-message-list-item">
              {showDate && date
                ? <div class="dui-date-separator"><time datetime={dateKey}>{labelFormat.format(date)}</time></div>
                : null}
              <Message
                onEphemeralDismiss={onEphemeralDismiss}
                onButtonClick={onButtonClick}
                onSelectChange={onSelectChange}
                onPremiumClick={onPremiumClick}
                message={message}
                selectValues={selectValuesByMessage && Object.hasOwn(selectValuesByMessage, message.id)
                  ? selectValuesByMessage[message.id]
                  : undefined}
                onReactionToggle={onReactionToggle}
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
  };
});
export type MessageListEmits = { "button-click": Parameters<NonNullable<MessageListProps["onButtonClick"]>>; "select-change": Parameters<NonNullable<MessageListProps["onSelectChange"]>>; "premium-click": Parameters<NonNullable<MessageListProps["onPremiumClick"]>>; "reaction-toggle": Parameters<NonNullable<MessageListProps["onReactionToggle"]>>; "ephemeral-dismiss": Parameters<NonNullable<MessageListProps["onEphemeralDismiss"]>>; "thread-open": Parameters<NonNullable<MessageListProps["onThreadOpen"]>> };
