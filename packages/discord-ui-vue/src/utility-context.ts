import type { MentionInteractionHandlers } from "@arcscord/discord-ui-core";
import type { InjectionKey } from "vue";
import { inject, provide } from "vue";

const mentionInteractions: InjectionKey<() => MentionInteractionHandlers<MouseEvent>> = Symbol("mentionInteractions");
export function provideMentionInteractions(handlers: () => MentionInteractionHandlers<MouseEvent>): void {
  provide(mentionInteractions, handlers);
}
export function useMentionInteractions(): () => MentionInteractionHandlers<MouseEvent> {
  return inject(mentionInteractions, () => ({}));
}

/** Bridge keyboard menu intent to the same native event used by pointer menus. */
export function dispatchKeyboardContextMenu(event: KeyboardEvent): void {
  if (event.defaultPrevented || !(event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")))
    return;
  const target = event.target;
  if (!(target instanceof HTMLElement))
    return;
  event.preventDefault();
  event.stopPropagation();
  const bounds = target.getBoundingClientRect();
  target.dispatchEvent(new MouseEvent("contextmenu", {
    button: 2,
    clientX: bounds.left,
    clientY: bounds.bottom,
    bubbles: true,
    cancelable: true,
  }));
}
