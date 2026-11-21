import type { MessageAuthor, UserInteractionHandlers } from "@arcscord/discord-ui-core";
import { mediaUrl } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { h } from "vue";
import { defineRenderer, state, styleValue } from "../../rendering";
import { dispatchKeyboardContextMenu } from "../../utility-context";

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
type AvatarImageInput = UserInteractionHandlers<MouseEvent> & { author: MessageAuthor; source: string | undefined; tabIndex?: number | undefined };
const AvatarImage = defineRenderer<AvatarImageInput, AvatarImageInput, Record<string, never>>("AvatarImage", [
  "author",
  "source",
  "tabIndex",
  "onUserClick",
  "onUserContextMenu",
], [], (input, _display) => {
  const [failedState, setFailed] = state<boolean>(false);
  function derive(withSlots = false) {
    const { author, source } = input(withSlots);
    const failed = failedState.value;
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
    return {
      author,
      source,
      failed,
      hash,
      fallback,
      background,
      color,
      text,
      letter,
    };
  }
  return () => {
    const { author, source, failed, background, color, letter } = derive(true);
    const { onUserClick, onUserContextMenu, tabIndex } = input();
    const interactive = Boolean(onUserClick || onUserContextMenu);
    return h(onUserClick || onUserContextMenu
      ? "button"
      : "span", {
      "class": `dui-avatar${interactive ? " dui-utility-target" : ""}`,
      "type": interactive ? "button" : undefined,
      "tabindex": interactive ? tabIndex : undefined,
      "aria-haspopup": !onUserClick && onUserContextMenu
        ? "menu"
        : undefined,
      "aria-label": interactive ? author.displayName : undefined,
      "aria-hidden": interactive ? undefined : "true",

      "style": styleValue({
        background: source && !failed
          ? "transparent"
          : background,
        color,
      }),
      "onClick": interactive
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
    }, source && !failed
      ? <img src={source} alt="" width={40} height={40} onError={() => setFailed(true)} />
      : <span aria-hidden={interactive ? "true" : undefined}>{letter}</span>);
  };
});
type AvatarPropsInput = UserInteractionHandlers<MouseEvent> & {
  tabIndex?: number | undefined;
  author: MessageAuthor;
};
export type AvatarProps = AvatarPropsInput;
export type AvatarSlots = Record<string, never>;
export const Avatar = defineRenderer<AvatarProps, AvatarPropsInput, AvatarSlots>("Avatar", [
  "onUserClick",
  "onUserContextMenu",
  "author",
  "tabIndex",
], [], (input, display) => {
  return () => {
    const { author, onUserClick, onUserContextMenu, tabIndex } = input(true);
    const { allowRemoteMedia, remoteMediaAllowlist } = display;
    const source = mediaUrl(author.avatarUrl, allowRemoteMedia, remoteMediaAllowlist);
    return <AvatarImage key={source ?? ""} author={author} source={source} tabIndex={tabIndex} onUserClick={onUserClick} onUserContextMenu={onUserContextMenu} />;
  };
});
export type AvatarEmits = import("../../public-component").EventsFromProps<UserInteractionHandlers<MouseEvent>>;
