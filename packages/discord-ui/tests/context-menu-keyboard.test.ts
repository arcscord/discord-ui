import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { contextMenuKey } from "../src/components/interaction-context";

class Target extends EventTarget {
  isConnected = true;
  ownerDocument = { activeElement: this };
  getBoundingClientRect() { return { left: 10, bottom: 20 }; }
}

function key(target: Target, focused: Target = target) {
  return {
    target: focused,
    currentTarget: target,
    key: "F10",
    shiftKey: true,
    repeat: false,
    defaultPrevented: false,
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  };
}

function release(target: Target) {
  const event = new Event("keyup");
  Object.defineProperty(event, "key", { value: "F10" });
  target.dispatchEvent(event);
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.stubGlobal("HTMLElement", Target);
  vi.stubGlobal("MouseEvent", Event);
});
afterEach(() => {
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("keyboard context menus", () => {
  it("leaves descendant key events and browser defaults untouched", () => {
    const event = key(new Target(), new Target());
    contextMenuKey(event as unknown as Parameters<typeof contextMenuKey>[0]);
    expect(event.preventDefault).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });

  it("uses one browser menu emitted during keydown or keyup", () => {
    for (const atKeyUp of [false, true]) {
      const target = new Target();
      const menu = vi.fn();
      target.addEventListener("contextmenu", menu);
      const event = key(target);
      contextMenuKey(event as unknown as Parameters<typeof contextMenuKey>[0]);
      expect(menu).not.toHaveBeenCalled();
      expect(event.preventDefault).not.toHaveBeenCalled();
      if (atKeyUp)
        release(target);
      target.dispatchEvent(new Event("contextmenu"));
      if (!atKeyUp)
        release(target);
      vi.runAllTimers();
      expect(menu).toHaveBeenCalledOnce();
    }
  });

  it("respects a parent cancelling the shortcut after it bubbles", () => {
    const target = new Target();
    const menu = vi.fn();
    target.addEventListener("contextmenu", menu);
    const event = key(target);
    contextMenuKey(event as unknown as Parameters<typeof contextMenuKey>[0]);
    event.defaultPrevented = true;
    release(target);
    vi.runAllTimers();
    expect(menu).not.toHaveBeenCalled();
  });

  it("falls back once after keyup when the browser emits no menu", () => {
    const target = new Target();
    const menu = vi.fn();
    target.addEventListener("contextmenu", menu);
    contextMenuKey(key(target) as unknown as Parameters<typeof contextMenuKey>[0]);
    expect(menu).not.toHaveBeenCalled();
    release(target);
    vi.runAllTimers();
    expect(menu).toHaveBeenCalledOnce();
  });
});
