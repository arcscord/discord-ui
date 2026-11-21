import type { MessageAuthor, UserInteractionHandlers } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { h } from "vue";
import { defineRenderer, styleValue } from "../../rendering";
import { dispatchKeyboardContextMenu } from "../../utility-context";

type AuthorPropsInput = UserInteractionHandlers<MouseEvent> & {
  author: MessageAuthor;
};
export type AuthorProps = AuthorPropsInput;
export type AuthorSlots = Record<string, never>;
export const Author = defineRenderer<AuthorProps, AuthorPropsInput, AuthorSlots>("Author", ["onUserClick", "onUserContextMenu", "author"], [], (input, _display) => {
  return () => {
    const { author, onUserClick, onUserContextMenu } = input(true);
    const color = /^#[a-f\d]{6}$/iu.test(author.color ?? "")
      ? author.color
      : undefined;
    return (
      <span class="dui-author">
        {h(onUserClick ? "button" : "span", {
          class: `dui-author-name${onUserClick || onUserContextMenu
            ? " dui-utility-target"
            : ""}`,
          type: onUserClick ? "button" : undefined,
          tabindex: !onUserClick && onUserContextMenu
            ? 0
            : undefined,
          style: styleValue(color
            ? { color }
            : undefined),
          onClick: onUserClick
            ? (event: MouseEvent) => onUserClick(author, event)
            : undefined,
          onKeydown: onUserContextMenu ? dispatchKeyboardContextMenu : undefined,
          onContextmenu: onUserContextMenu
            ? (event: MouseEvent) => {
                event.stopPropagation();
                onUserContextMenu(author, event);
              }
            : undefined,
        }, author.displayName)}
        {author.bot
          ? <span class="dui-bot-badge">{author.verified ? "✓ APP" : "APP"}</span>
          : null}
      </span>
    );
  };
});
export type AuthorEmits = import("../../public-component").EventsFromProps<UserInteractionHandlers<MouseEvent>>;
