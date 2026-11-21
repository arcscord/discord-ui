import { afterEach, expect, it, vi } from "vitest";
import { dispatchKeyboardContextMenu } from "../src/utility-context";

class Target extends EventTarget {
  isConnected = true;
  ownerDocument = {
    activeElement: this,
    defaultView: { MouseEvent: MenuEvent },
  };

  getBoundingClientRect() { return { left: 12, bottom: 34 }; }
}
class MenuEvent extends Event {
  constructor(type: string, public options: MouseEventInit) { super(type, options); }
}
function shortcut(target: Target, extra = {}) {
  return {
    key: "F10",
    shiftKey: true,
    repeat: false,
    defaultPrevented: false,
    target,
    currentTarget: target,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...extra,
  } as unknown as KeyboardEvent;
}
function release(target: Target) {
  const event = new Event("keyup");
  Object.assign(event, { key: "F10" });
  target.dispatchEvent(event);
}
afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

it.each(["keydown", "keyup", "fallback"])("prefers native %s context menus and dispatches at most once", (phase) => {
  vi.useFakeTimers();
  vi.stubGlobal("HTMLElement", Target);
  const target = new Target();
  const menu = vi.fn();
  target.addEventListener("contextmenu", menu);
  const key = shortcut(target);
  dispatchKeyboardContextMenu(key);
  if (phase === "keydown")
    target.dispatchEvent(new Event("contextmenu"));
  release(target);
  if (phase === "keyup")
    target.dispatchEvent(new Event("contextmenu"));
  vi.runAllTimers();
  expect(menu).toHaveBeenCalledOnce();
  expect(key.preventDefault).not.toHaveBeenCalled();
  expect(key.stopPropagation).not.toHaveBeenCalled();
  if (phase === "fallback") {
    const event = menu.mock.calls[0]![0] as MenuEvent;
    expect(event.options).toMatchObject({
      button: 2,
      clientX: 12,
      clientY: 34,
      bubbles: true,
      cancelable: true,
    });
  }
});

it("ignores descendant shortcuts, repeat events and unfocused targets", () => {
  vi.useFakeTimers();
  vi.stubGlobal("HTMLElement", Target);
  const target = new Target();
  const menu = vi.fn();
  target.addEventListener("contextmenu", menu);
  dispatchKeyboardContextMenu(shortcut(target, {
    target: new Target(),
  }));
  dispatchKeyboardContextMenu(shortcut(target, { repeat: true }));
  release(target);
  vi.runAllTimers();
  expect(menu).not.toHaveBeenCalled();
  dispatchKeyboardContextMenu(shortcut(target));
  target.isConnected = false;
  release(target);
  vi.runAllTimers();
  expect(menu).not.toHaveBeenCalled();
});
