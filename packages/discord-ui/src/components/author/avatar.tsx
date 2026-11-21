import type { MessageAuthor } from "@arcscord/discord-ui-core";
import type { UserInteractionHandlers } from "../../interactions";
import { mediaUrl } from "@arcscord/discord-ui-core";
import { useState } from "react";
import { useDisplayOptions } from "../display-context";
import { contextMenuKey } from "../interaction-context";

const backgrounds = [
  "#5865f2",
  "#3b8066",
  "#a94c70",
  "#98601d",
  "#6955a4",
  "#337c96",
];
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

function hexColor(value: string | undefined): string | undefined {
  return /^#[a-f\d]{6}$/iu.test(value ?? "")
    ? value
    : undefined;
}

function AvatarImage({ author, source, onUserClick, onUserContextMenu, tabIndex }: AvatarProps & { source: string | undefined }) {
  const [failed, setFailed] = useState(false);
  let hash = 0;
  for (const character of author.id)
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  const fallback = author.avatarFallback;
  const background = hexColor(fallback?.background) ?? backgrounds[hash % backgrounds.length];
  const color = hexColor(fallback?.color) ?? "#ffffff";
  const text = fallback?.letter?.trim() || author.displayName.trim();
  const letter = [
    ...segmenter.segment(text),
  ][0]?.segment.toLocaleUpperCase("en-US") || "?";
  const interactive = Boolean(onUserClick || onUserContextMenu);
  const Wrapper = interactive ? "button" : "span";
  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      className={`dui-avatar${interactive ? " dui-utility-target" : ""}`}
      aria-hidden={interactive ? undefined : true}
      aria-label={interactive ? author.displayName : undefined}
      aria-haspopup={!onUserClick && onUserContextMenu
        ? "menu"
        : undefined}
      tabIndex={interactive ? tabIndex : undefined}
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
      style={{
        background: source && !failed
          ? "transparent"
          : background,
        color,
      }}
    >
      {source && !failed
        ? <img src={source} alt="" width={40} height={40} onError={() => setFailed(true)} />
        : <span>{letter}</span>}
    </Wrapper>
  );
}

export type AvatarProps = UserInteractionHandlers & { author: MessageAuthor; tabIndex?: number | undefined };

export function Avatar({ author, ...handlers }: AvatarProps) {
  const { allowRemoteMedia, remoteMediaAllowlist } = useDisplayOptions();
  const source = mediaUrl(author.avatarUrl, allowRemoteMedia, remoteMediaAllowlist);
  return <AvatarImage key={source} author={author} source={source} {...handlers} />;
}
