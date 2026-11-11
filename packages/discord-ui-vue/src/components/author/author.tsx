import type { MessageAuthor } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { defineRenderer, styleValue } from "../../rendering";

type AuthorPropsInput = {
  author: MessageAuthor;
};
export type AuthorProps = AuthorPropsInput;
export type AuthorSlots = Record<string, never>;
export const Author = defineRenderer<AuthorProps, AuthorPropsInput, AuthorSlots>("Author", ["author"], [], (input, _display) => {
  return () => {
    const { author } = input(true);
    const color = /^#[a-f\d]{6}$/iu.test(author.color ?? "")
      ? author.color
      : undefined;
    return (
      <span class="dui-author">
        <span
          class="dui-author-name"
          style={styleValue(color
            ? { color }
            : undefined)}
        >
          {author.displayName}
        </span>
        {author.bot
          ? <span class="dui-bot-badge">{author.verified ? "✓ APP" : "APP"}</span>
          : null}
      </span>
    );
  };
});
export type AuthorEmits = Record<string, never>;
