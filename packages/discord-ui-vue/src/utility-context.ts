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

const pendingMenus = new WeakMap<HTMLElement, () => void>();

/** Prefer the platform menu event, with a fallback after shortcut release. */
export function dispatchKeyboardContextMenu(event: KeyboardEvent): void {
  if (event.defaultPrevented || event.repeat || event.target !== event.currentTarget || !(event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")))
    return;
  const target = event.currentTarget;
  if (!(target instanceof HTMLElement))
    return;
  pendingMenus.get(target)?.();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const cleanup = () => {
    clearTimeout(timer);
    target.removeEventListener("contextmenu", cleanup, true);
    target.removeEventListener("keyup", release);
    target.removeEventListener("blur", cleanup);
    pendingMenus.delete(target);
  };
  const release = (released: KeyboardEvent) => {
    if (released.key !== event.key)
      return;
    target.removeEventListener("keyup", release);
    timer = setTimeout(() => {
      cleanup();
      if (event.defaultPrevented || released.defaultPrevented || !target.isConnected || target.ownerDocument.activeElement !== target)
        return;
      const bounds = target.getBoundingClientRect();
      const NativeMouseEvent = target.ownerDocument.defaultView?.MouseEvent ?? MouseEvent;
      target.dispatchEvent(new NativeMouseEvent("contextmenu", {
        button: 2,
        clientX: bounds.left,
        clientY: bounds.bottom,
        bubbles: true,
        cancelable: true,
      }));
    }, 0);
  };
  pendingMenus.set(target, cleanup);
  target.addEventListener("contextmenu", cleanup, true);
  target.addEventListener("keyup", release);
  target.addEventListener("blur", cleanup);
}

export function isNativeControlContextMenu(event: MouseEvent): boolean {
  const target = event.target;
  if (!(target instanceof Element))
    return false;
  const control = target.closest("a[href],button,input,select,textarea,summary,[contenteditable=\"true\"],[role=\"button\"],[role=\"link\"],[role=\"textbox\"],[role=\"combobox\"],[role=\"listbox\"],[role=\"menu\"],[role=\"menuitem\"],[role=\"checkbox\"],[role=\"radio\"],[role=\"slider\"],[role=\"spinbutton\"],[role=\"switch\"],audio[controls],video[controls]");
  return Boolean(control && !control.classList.contains("dui-utility-target"));
}
