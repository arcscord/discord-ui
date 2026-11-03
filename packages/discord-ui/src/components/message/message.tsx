import type { ComponentHandlers, SelectValues } from "../../model/components";
import type { MessageView } from "../../model/message";
import type { ReactionToggleHandler } from "../../model/reaction";
import { Avatar } from "../author/avatar";
import { MessageComponents } from "../components-v2/message-components";
import { File } from "../components-v2/primitives";
import { Markdown } from "../content/markdown";
import { useDisplayOptions } from "../display-context";
import { Embed } from "../embed/embed";
import { MediaGallery } from "../media/media-gallery";
import { ThreadPreview } from "../thread/thread-preview";
import { MessageContent } from "./message-content";
import { MessageFrame } from "./message-frame";
import { MessageHeader } from "./message-header";
import { Reactions } from "./reactions";
import { ReplyPreview } from "./reply-preview";

export type MessageProps = ComponentHandlers & {
  onReactionToggle?: ReactionToggleHandler | undefined;
  message: MessageView;
  selectValues?: SelectValues | undefined;
  onEphemeralDismiss?: ((messageId: string) => void) | undefined;
  onThreadOpen?: ((id: string) => void) | undefined;
  activeThreadId?: string | undefined;
  showThreadPreview?: boolean | undefined;
};

export function Message({ message, selectValues, onEphemeralDismiss, onReactionToggle, onThreadOpen, activeThreadId, showThreadPreview = true, onButtonClick, onSelectChange, onPremiumClick }: MessageProps) {
  const { referenceTime: reference, labels } = useDisplayOptions();
  const referenceTime = reference ?? message.timestamp;
  return (
    <MessageFrame
      ephemeral={message.ephemeral === true}
      reply={message.reply
        ? <ReplyPreview reply={message.reply} />
        : undefined}
      avatar={<Avatar author={message.author} />}
      header={<MessageHeader author={message.author} timestamp={message.timestamp} edited={message.edited} />}
      hasThread={showThreadPreview && Boolean(message.thread)}
      footer={(
        <>
          {showThreadPreview && message.thread
            ? <ThreadPreview thread={message.thread} onOpen={onThreadOpen} active={activeThreadId === message.thread.id} />
            : null}
          {message.ephemeral
            ? (
                <div className="dui-ephemeral-notice">
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" stroke="currentColor" strokeWidth="2" />
                    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                    <path d="m4 21 16-18" stroke="currentColor" strokeWidth="2" />
                  </svg>
                  <span>{labels.ephemeralNotice}</span>
                  {onEphemeralDismiss
                    ? (
                        <>
                          <span aria-hidden="true">·</span>
                          <button type="button" className="dui-ephemeral-dismiss" onClick={() => onEphemeralDismiss(message.id)}>{labels.dismissMessage}</button>
                        </>
                      )
                    : null}
                </div>
              )
            : null}
        </>
      )}
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
}
