import type { KeyboardEvent } from "react";
import type { MentionInteractionHandlers } from "../interactions";
import { createContext, use } from "react";

/** Carries host actions through embeds and Components V2 Markdown. */
export const MentionInteractionContext = createContext<MentionInteractionHandlers>({});

export function useMentionInteractions(handlers: MentionInteractionHandlers): MentionInteractionHandlers {
  const inherited = use(MentionInteractionContext);
  return {
    onMentionClick: handlers.onMentionClick ?? inherited.onMentionClick,
    onMentionContextMenu: handlers.onMentionContextMenu ?? inherited.onMentionContextMenu,
  };
}

/** Give focused utility targets the same context action on every platform. */
export function contextMenuKey(event: KeyboardEvent<HTMLElement>): void {
  if (event.defaultPrevented || !(event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")))
    return;
  const target = event.target;
  if (!(target instanceof HTMLElement))
    return;
  event.preventDefault();
  event.stopPropagation();
  const bounds = target.getBoundingClientRect();
  target.dispatchEvent(new MouseEvent("contextmenu", {
    bubbles: true,
    cancelable: true,
    button: 2,
    clientX: bounds.left,
    clientY: bounds.bottom,
  }));
}
