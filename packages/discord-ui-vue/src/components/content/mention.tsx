// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { MentionInteractionHandlers, MentionTarget } from "@arcscord/discord-ui-core";
import { h } from "vue";
import { defineRenderer, styleValue } from "../../rendering";
import { dispatchKeyboardContextMenu, useMentionInteractions } from "../../utility-context";

type MentionPropsInput = MentionInteractionHandlers<MouseEvent> & {
  id?: string | undefined;
  name: string;
  kind?: MentionTarget["kind"] | undefined;
  color?: string | undefined;
};
export type MentionProps = MentionPropsInput;
export type MentionSlots = Record<string, never>;
export const Mention = defineRenderer<MentionProps, MentionPropsInput, MentionSlots>("Mention", [
  "id",
  "name",
  "kind",
  "color",
  "onMentionClick",
  "onMentionContextMenu",
], [], (input, _display) => {
  const inherited = useMentionInteractions();
  return () => {
    const { id, name, kind = "user", color, onMentionClick, onMentionContextMenu } = input(true);
    const click = onMentionClick ?? inherited().onMentionClick;
    const contextMenu = onMentionContextMenu ?? inherited().onMentionContextMenu;
    const target: MentionTarget | undefined = id
      ? { id, name, kind, color }
      : undefined;
    const interactive = Boolean(target && (click || contextMenu));
    const safeColor = /^#[a-f\d]{6}$/iu.test(color ?? "")
      ? color
      : undefined;
    return h(interactive
      ? "button"
      : "span", {
      "class": `dui-mention${interactive ? " dui-utility-target" : ""}`,
      "type": interactive
        ? "button"
        : undefined,
      "aria-haspopup": target && !click && contextMenu
        ? "menu"
        : undefined,
      "style": styleValue(safeColor
        ? {
            color: safeColor,
            // Discord tints role mentions with the role color: 10% fill, 30% on hover.
            ...(kind === "role"
              ? { "--discord-ui-mention-fill": `${safeColor}1a`, "--discord-ui-mention-fill-hover": `${safeColor}4d` }
              : {}),
          }
        : undefined),
      "onClick": target && (click || contextMenu)
        ? (event: MouseEvent) => {
            if (click) {
              click(target, event);
            }
            else {
              event.stopPropagation();
              contextMenu?.(target, event);
            }
          }
        : undefined,
      "onKeydown": target && contextMenu
        ? dispatchKeyboardContextMenu
        : undefined,
      "onContextmenu": target && contextMenu
        ? (event: MouseEvent) => {
            event.stopPropagation();
            contextMenu(target, event);
          }
        : undefined,
    }, `${kind === "channel"
      ? "#"
      : kind === "command"
        ? "/"
        : "@"}${name}`);
  };
});
export type MentionEmits = import("../../public-component").EventsFromProps<MentionProps>;
