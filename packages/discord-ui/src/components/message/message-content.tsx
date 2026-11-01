import { UnicodeEmoji } from "../content/unicode-emoji";

export function MessageContent({ content }: { content: string }) {
  return <div className="dui-message-text"><UnicodeEmoji content={content} /></div>;
}
