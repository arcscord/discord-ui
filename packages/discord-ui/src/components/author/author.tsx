import type { MessageAuthor } from "../../model/message";

export function Author({ author }: { author: MessageAuthor }) {
  const color = /^#[a-f\d]{6}$/iu.test(author.color ?? "")
    ? author.color
    : undefined;
  return (
    <span className="dui-author">
      <span
        className="dui-author-name"
        style={color
          ? { color }
          : undefined}
      >
        {author.displayName}
      </span>
      {author.bot
        ? <span className="dui-bot-badge">{author.verified ? "✓ APP" : "APP"}</span>
        : null}
    </span>
  );
}
