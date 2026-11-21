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

const pendingMenus = new WeakMap<HTMLElement, () => void>();

/** Prefer the browser's menu, with a fallback after its keyup default action. */
export function contextMenuKey(event: KeyboardEvent<HTMLElement>): void {
  if (event.defaultPrevented || event.repeat || event.target !== event.currentTarget || !(event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")))
    return;
  const target = event.currentTarget;
  const key = event.key;
  pendingMenus.get(target)?.();
  let timer: ReturnType<typeof setTimeout> | undefined;
  function cleanup(): void {
    clearTimeout(timer);
    target.removeEventListener("contextmenu", cleanup, true);
    target.removeEventListener("keyup", release);
    target.removeEventListener("blur", cleanup);
    pendingMenus.delete(target);
  }
  function release(released: globalThis.KeyboardEvent): void {
    if (released.key !== key)
      return;
    target.removeEventListener("keyup", release);
    timer = setTimeout(() => {
      cleanup();
      if (event.defaultPrevented || released.defaultPrevented || !target.isConnected || target.ownerDocument.activeElement !== target)
        return;
      const bounds = target.getBoundingClientRect();
      target.dispatchEvent(new MouseEvent("contextmenu", {
        bubbles: true,
        cancelable: true,
        button: 2,
        clientX: bounds.left,
        clientY: bounds.bottom,
      }));
    }, 0);
  }
  target.addEventListener("contextmenu", cleanup, true);
  target.addEventListener("keyup", release);
  target.addEventListener("blur", cleanup);
  pendingMenus.set(target, cleanup);
}

/** Child controls keep their own browser menus. Utility targets may fall back. */
export function hasNativeContextMenu(target: EventTarget, boundary: HTMLElement): boolean {
  if (!(target instanceof Element))
    return false;
  const control = target.closest("a[href],button,input,select,textarea,summary,[contenteditable=\"true\"],[role=\"button\"],[role=\"link\"],[role=\"textbox\"],[role=\"combobox\"],[role=\"listbox\"],[role=\"menu\"],[role=\"menuitem\"],[role=\"checkbox\"],[role=\"radio\"],[role=\"slider\"],[role=\"spinbutton\"],[role=\"switch\"],audio[controls],video[controls]");
  return Boolean(control && control !== boundary && boundary.contains(control) && !control.classList.contains("dui-utility-target"));
}
