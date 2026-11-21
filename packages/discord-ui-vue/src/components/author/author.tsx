import type { MessageAuthor, UserInteractionHandlers } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { mediaUrl } from "@arcscord/discord-ui-core";
import { h } from "vue";
import { defineRenderer, styleValue } from "../../rendering";
import { dispatchKeyboardContextMenu } from "../../utility-context";

type AuthorPropsInput = UserInteractionHandlers<MouseEvent> & {
  author: MessageAuthor;
};
export type AuthorProps = AuthorPropsInput;
export type AuthorSlots = Record<string, never>;
export const Author = defineRenderer<AuthorProps, AuthorPropsInput, AuthorSlots>("Author", ["onUserClick", "onUserContextMenu", "author"], [], (input, display) => {
  return () => {
    const { author, onUserClick, onUserContextMenu } = input(true);
    const tagBadge = mediaUrl(author.tag?.badgeUrl, display.allowRemoteMedia, display.remoteMediaAllowlist);
    const color = /^#[a-f\d]{6}$/iu.test(author.color ?? "")
      ? author.color
      : undefined;
    return (
      <span class="dui-author">
        {h(onUserClick || onUserContextMenu
          ? "button"
          : "span", {
          "class": `dui-author-name${onUserClick || onUserContextMenu
            ? " dui-utility-target"
            : ""}`,
          "type": onUserClick || onUserContextMenu
            ? "button"
            : undefined,
          "aria-haspopup": !onUserClick && onUserContextMenu
            ? "menu"
            : undefined,
          "style": styleValue(color
            ? { color }
            : undefined),
          "onClick": onUserClick || onUserContextMenu
            ? (event: MouseEvent) => {
                if (onUserClick) {
                  onUserClick(author, event);
                }
                else {
                  event.stopPropagation();
                  onUserContextMenu?.(author, event);
                }
              }
            : undefined,
          "onKeydown": onUserContextMenu ? dispatchKeyboardContextMenu : undefined,
          "onContextmenu": onUserContextMenu
            ? (event: MouseEvent) => {
                event.stopPropagation();
                onUserContextMenu(author, event);
              }
            : undefined,
        }, author.displayName)}
        {author.tag?.text
          ? (
              <span class="dui-author-tag">
                {tagBadge
                  ? <img class="dui-author-tag-badge" src={tagBadge} alt="" width={13} height={13} />
                  : null}
                <span class="dui-author-tag-text">{author.tag.text}</span>
              </span>
            )
          : null}
        {author.bot
          ? <span class="dui-bot-badge">{author.verified ? "✓ APP" : "APP"}</span>
          : null}
      </span>
    );
  };
});
export type AuthorEmits = import("../../public-component").EventsFromProps<UserInteractionHandlers<MouseEvent>>;
