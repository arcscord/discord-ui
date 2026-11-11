import type { ComponentHandlers, MessageView, ReactionToggleHandler, SelectValues } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { defineRenderer } from "../../rendering";
import { Avatar } from "../author/avatar";
import { MessageComponents } from "../components-v2/message-components";
import { File } from "../components-v2/primitives";
import { Markdown } from "../content/markdown";
import { Embed } from "../embed/embed";
import { MediaGallery } from "../media/media-gallery";
import { ThreadPreview } from "../thread/thread-preview";
import { MessageContent } from "./message-content";
import { MessageFrame } from "./message-frame";
import { MessageHeader } from "./message-header";
import { Reactions } from "./reactions";
import { ReplyPreview } from "./reply-preview";

type MessagePropsInput = ComponentHandlers & {
  onReactionToggle?: ReactionToggleHandler | undefined;
  message: MessageView;
  selectValues?: SelectValues | undefined;
  onEphemeralDismiss?: ((messageId: string) => void) | undefined;
  onThreadOpen?: ((id: string) => void) | undefined;
  activeThreadId?: string | undefined;
  showThreadPreview?: boolean | undefined;
};
export type MessageProps = MessagePropsInput;
export type MessageSlots = Record<string, never>;
export const Message = defineRenderer<MessageProps, MessagePropsInput, MessageSlots>("Message", [
  "onButtonClick",
  "onSelectChange",
  "onPremiumClick",
  "onReactionToggle",
  "message",
  "selectValues",
  "onEphemeralDismiss",
  "onThreadOpen",
  "activeThreadId",
  "showThreadPreview",
], [], (input, display) => {
  return () => {
    const { message, selectValues, onEphemeralDismiss, onReactionToggle, onThreadOpen, activeThreadId, showThreadPreview = true, onButtonClick, onSelectChange, onPremiumClick } = input(true);
    const { referenceTime: reference, labels } = display;
    const referenceTime = reference ?? message.timestamp;
    return (
      <MessageFrame
        ephemeral={message.ephemeral === true}
        hasThread={showThreadPreview && Boolean(message.thread)}
        v-slots={{
          reply: () => message.reply
            ? <ReplyPreview reply={message.reply} />
            : undefined,
          avatar: () => <Avatar author={message.author} />,
          header: () => <MessageHeader author={message.author} timestamp={message.timestamp} edited={message.edited} />,
          footer: () => (
            <>
              {showThreadPreview && message.thread
                ? (
                    <ThreadPreview
                      thread={message.thread}
                      {...(onThreadOpen
                        ? { onOpen: onThreadOpen }
                        : {})}
                      active={activeThreadId === message.thread.id}
                    />
                  )
                : null}
              {message.ephemeral
                ? (
                    <div class="dui-ephemeral-notice">
                      <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" stroke-width="2" />
                        <circle cx="12" cy="12" r="3" stroke="currentColor" stroke-width="2" />
                        <path d="m4 21 16-18" stroke="currentColor" stroke-width="2" />
                      </svg>
                      <span>{labels.ephemeralNotice}</span>
                      {onEphemeralDismiss
                        ? (
                            <>
                              <span aria-hidden="true">·</span>
                              <button type="button" class="dui-ephemeral-dismiss" onClick={() => onEphemeralDismiss(message.id)}>{labels.dismissMessage}</button>
                            </>
                          )
                        : null}
                    </div>
                  )
                : null}
            </>
          ),
        }}
      >
        {message.body.kind === "components-v2"
          ? <MessageComponents messageId={message.id} selectValues={selectValues} components={message.body.components} referenceTime={referenceTime} onButtonClick={onButtonClick} onSelectChange={onSelectChange} onPremiumClick={onPremiumClick} />
          : message.body.kind === "markdown"
            ? <Markdown content={message.body.content} referenceTime={referenceTime} />
            : <MessageContent content={message.body.content} />}
        {message.media?.length
          ? <MediaGallery items={message.media} />
          : null}
        {message.attachments?.map(file => <File key={file.id} file={file} />)}
        {message.embeds?.map(embed => <Embed key={embed.id} embed={embed} referenceTime={referenceTime} />)}
        {message.components?.length
          ? <MessageComponents messageId={message.id} selectValues={selectValues} components={message.components} onButtonClick={onButtonClick} onSelectChange={onSelectChange} onPremiumClick={onPremiumClick} />
          : null}
        {message.reactions?.length
          ? (
              <Reactions
                reactions={message.reactions}
                onToggle={onReactionToggle
                  ? id => onReactionToggle(message.id, id)
                  : undefined}
              />
            )
          : null}
      </MessageFrame>
    );
  };
});
export type MessageEmits = { "button-click": Parameters<NonNullable<MessageProps["onButtonClick"]>>; "select-change": Parameters<NonNullable<MessageProps["onSelectChange"]>>; "premium-click": Parameters<NonNullable<MessageProps["onPremiumClick"]>>; "reaction-toggle": Parameters<NonNullable<MessageProps["onReactionToggle"]>>; "ephemeral-dismiss": Parameters<NonNullable<MessageProps["onEphemeralDismiss"]>>; "thread-open": Parameters<NonNullable<MessageProps["onThreadOpen"]>> };
