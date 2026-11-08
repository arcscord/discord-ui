import type { MessageAuthor } from "@arcscord/discord-ui-core";

export type AuthorProps = { author: MessageAuthor };

export function Author({ author }: AuthorProps) {
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
