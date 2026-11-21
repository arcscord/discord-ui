import type { MessageAuthor } from "@arcscord/discord-ui-core";
import type { UserInteractionHandlers } from "../../interactions";
import { contextMenuKey } from "../interaction-context";

export type AuthorProps = UserInteractionHandlers & { author: MessageAuthor };

export function Author({ author, onUserClick, onUserContextMenu }: AuthorProps) {
  const color = /^#[a-f\d]{6}$/iu.test(author.color ?? "")
    ? author.color
    : undefined;
  const Name = onUserClick ? "button" : "span";
  return (
    <span className="dui-author">
      <Name
        type={onUserClick ? "button" : undefined}
        className={`dui-author-name${onUserClick || onUserContextMenu
          ? " dui-utility-target"
          : ""}`}
        tabIndex={!onUserClick && onUserContextMenu
          ? 0
          : undefined}
        onKeyDown={onUserContextMenu ? contextMenuKey : undefined}
        onClick={onUserClick
          ? event => onUserClick(author, event)
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
