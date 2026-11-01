import type { MessageView } from "../../model/message";
import type { ReactionToggleHandler } from "../../model/reaction";
import { Avatar } from "../author/avatar";
import { MessageComponents } from "../components-v2/message-components";
import { Markdown } from "../content/markdown";
import { useDisplayOptions } from "../display-context";
import { Embed } from "../embed/embed";
import { MediaGallery } from "../media/media-gallery";
import { ThreadPreview } from "../thread/thread-preview";
import { MessageContent } from "./message-content";
import { MessageFrame } from "./message-frame";
import { MessageHeader } from "./message-header";
import { Reactions } from "./reactions";

export type MessageProps = {
  onReactionToggle?: ReactionToggleHandler | undefined;
  message: MessageView;
  onThreadOpen?: ((id: string) => void) | undefined;
  activeThreadId?: string | undefined;
  showThreadPreview?: boolean | undefined;
};

export function Message({ message, onReactionToggle, onThreadOpen, activeThreadId, showThreadPreview = true }: MessageProps) {
  const { referenceTime: reference } = useDisplayOptions();
  const referenceTime = reference ?? message.timestamp;
  return (
    <MessageFrame
      avatar={<Avatar author={message.author} />}
      header={<MessageHeader author={message.author} timestamp={message.timestamp} />}
      hasThread={showThreadPreview && Boolean(message.thread)}
      footer={showThreadPreview && message.thread
        ? <ThreadPreview thread={message.thread} onOpen={onThreadOpen} active={activeThreadId === message.thread.id} />
        : undefined}
    >
      {message.body.kind === "components-v2"
        ? <MessageComponents components={message.body.components} referenceTime={referenceTime} />
        : message.body.kind === "markdown"
          ? <Markdown content={message.body.content} referenceTime={referenceTime} />
          : <MessageContent content={message.body.content} />}
      {message.media?.length
        ? <MediaGallery items={message.media} />
        : null}
      {message.embeds?.map(embed => <Embed key={embed.id} embed={embed} referenceTime={referenceTime} />)}
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
