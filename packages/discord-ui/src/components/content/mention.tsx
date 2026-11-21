import type { MentionInteractionHandlers, MentionTarget } from "../../interactions";
import { contextMenuKey, useMentionInteractions } from "../interaction-context";

export type MentionProps = MentionInteractionHandlers & { id?: string | undefined; name: string; kind?: MentionTarget["kind"]; color?: string | undefined };

export function Mention({ id, name, kind = "user", color, ...handlers }: MentionProps) {
  const { onMentionClick, onMentionContextMenu } = useMentionInteractions(handlers);
  const target = id
    ? { id, name, kind, color }
    : undefined;
  const clickable = Boolean(target && onMentionClick);
  const contextual = Boolean(target && onMentionContextMenu);
  const interactive = clickable || contextual;
  const Wrapper = interactive ? "button" : "span";
  const safeColor = /^#[a-f\d]{6}$/iu.test(color ?? "")
    ? color
    : undefined;
  return (
    <Wrapper
      type={interactive ? "button" : undefined}
      className={`dui-mention${clickable || contextual
        ? " dui-utility-target"
        : ""}`}
      aria-haspopup={!clickable && contextual
        ? "menu"
        : undefined}
      onKeyDown={contextual ? contextMenuKey : undefined}
      onClick={target && interactive
        ? (event) => {
            if (onMentionClick) {
              onMentionClick(target, event);
            }
            else {
              event.stopPropagation();
              onMentionContextMenu?.(target, event);
            }
          }
        : undefined}
      onContextMenu={target && onMentionContextMenu
        ? (event) => {
            event.stopPropagation();
            onMentionContextMenu(target, event);
          }
        : undefined}
      style={safeColor
        ? { color: safeColor }
        : undefined}
    >
      {kind === "channel"
        ? "#"
        : kind === "command"
          ? "/"
          : "@"}
      {name}
    </Wrapper>
  );
}
