import { UnicodeEmoji } from "../content/unicode-emoji";

export type MessageContentProps = { content: string };

export function MessageContent({ content }: MessageContentProps) {
  return <div className="dui-message-text"><UnicodeEmoji content={content} /></div>;
}
