import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { contextMenuKeyboard } from "../src/context-menu-keyboard.js";

class Target extends EventTarget {
  isConnected = true;
  ownerDocument = { activeElement: this as Target | null };
  getBoundingClientRect() {
    return { left: 10, bottom: 20 };
  }
}
class ContextMenu extends Event {
  constructor(type: string, options?: MouseEventInit) {
    super(type, options);
  }
}
function press(target: Target, overrides: Partial<KeyboardEvent> = {}): KeyboardEvent {
  return {
    target,
    currentTarget: target,
    key: "F10",
    shiftKey: true,
    defaultPrevented: false,
    repeat: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
    ...overrides,
  } as unknown as KeyboardEvent;
}
function release(target: Target): void {
  target.dispatchEvent(Object.assign(new Event("keyup"), { key: "F10" }));
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("HTMLElement", Target);
  vi.stubGlobal("MouseEvent", ContextMenu);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("native-first keyboard context menus", () => {
  it("preserves keydown and waits for keyup before supplying a missing native event", () => {
    const target = new Target();
    const menu = vi.fn();
    target.addEventListener("contextmenu", menu);
    const event = press(target);
    contextMenuKeyboard(event);
    vi.runAllTimers();
    expect(menu).not.toHaveBeenCalled();
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
    release(target);
    expect(menu).not.toHaveBeenCalled();
    vi.runAllTimers();
    expect(menu).toHaveBeenCalledTimes(1);
  });

  it.each(["keydown", "keyup"])("does not duplicate a native event emitted on %s", (phase) => {
    const target = new Target();
    const menu = vi.fn();
    target.addEventListener("contextmenu", menu);
    contextMenuKeyboard(press(target));
    if (phase === "keyup")
      release(target);
    target.dispatchEvent(new Event("contextmenu", { bubbles: true, cancelable: true }));
    if (phase === "keydown")
      release(target);
    vi.runAllTimers();
    expect(menu).toHaveBeenCalledTimes(1);
  });

  it("ignores descendant, repeated and already handled keydowns", () => {
    const target = new Target();
    const menu = vi.fn();
    target.addEventListener("contextmenu", menu);
    for (const overrides of [
      {
        currentTarget: new Target(),
      },
      { repeat: true },
      { defaultPrevented: true },
    ])
      contextMenuKeyboard(press(target, overrides as Partial<KeyboardEvent>));
    release(target);
    vi.runAllTimers();
    expect(menu).not.toHaveBeenCalled();
  });

  it.each(["blur", "disconnected", "focus moved"])("cancels the fallback when %s", (reason) => {
    const target = new Target();
    const menu = vi.fn();
    target.addEventListener("contextmenu", menu);
    contextMenuKeyboard(press(target));
    release(target);
    if (reason === "blur")
      target.dispatchEvent(new Event("blur"));
    if (reason === "disconnected")
      target.isConnected = false;
    if (reason === "focus moved")
      target.ownerDocument.activeElement = null;
    vi.runAllTimers();
    expect(menu).not.toHaveBeenCalled();
  });
});
