import type { MessageView } from "../../model/message";
import { Avatar } from "../author/avatar";
import { MessageComponents } from "../components-v2/message-components";
import { Markdown } from "../content/markdown";
import { useDisplayOptions } from "../display-context";
import { Embed } from "../embed/embed";
import { MediaGallery } from "../media/media-gallery";
import { MessageContent } from "./message-content";
import { MessageFrame } from "./message-frame";
import { MessageHeader } from "./message-header";

export function Message({ message }: { message: MessageView }) {
  const { referenceTime: reference } = useDisplayOptions();
  const referenceTime = reference ?? message.timestamp;
  return (
    <MessageFrame avatar={<Avatar author={message.author} />} header={<MessageHeader author={message.author} timestamp={message.timestamp} />}>
      {message.body.kind === "components-v2"
        ? <MessageComponents components={message.body.components} referenceTime={referenceTime} />
        : message.body.kind === "markdown"
          ? <Markdown content={message.body.content} referenceTime={referenceTime} />
          : <MessageContent content={message.body.content} />}
      {message.media?.length
        ? <MediaGallery items={message.media} />
        : null}
      {message.embeds?.map(embed => <Embed key={embed.id} embed={embed} referenceTime={referenceTime} />)}
    </MessageFrame>
  );
}
