import type { MessageAuthor } from "@arcscord/discord-ui-core";
import type { UserInteractionHandlers } from "../../interactions";
import { contextMenuKey } from "../interaction-context";

export type AuthorProps = UserInteractionHandlers & { author: MessageAuthor };

export function Author({ author, onUserClick, onUserContextMenu }: AuthorProps) {
  const color = /^#[a-f\d]{6}$/iu.test(author.color ?? "")
    ? author.color
    : undefined;
  const interactive = Boolean(onUserClick || onUserContextMenu);
  const Name = interactive ? "button" : "span";
  return (
    <span className="dui-author">
      <Name
        type={interactive ? "button" : undefined}
        className={`dui-author-name${onUserClick || onUserContextMenu
          ? " dui-utility-target"
          : ""}`}
        aria-haspopup={!onUserClick && onUserContextMenu
          ? "menu"
          : undefined}
        onKeyDown={onUserContextMenu ? contextMenuKey : undefined}
        onClick={interactive
          ? (event) => {
              if (onUserClick) {
                onUserClick(author, event);
              }
              else {
                event.stopPropagation();
                onUserContextMenu?.(author, event);
              }
            }
          : undefined}
        onContextMenu={onUserContextMenu
          ? (event) => {
              event.stopPropagation();
              onUserContextMenu(author, event);
            }
          : undefined}
        style={color
          ? { color }
          : undefined}
      >
        {author.displayName}
      </Name>
      {author.bot
        ? <span className="dui-bot-badge">{author.verified ? "✓ APP" : "APP"}</span>
        : null}
    </span>
  );
}
