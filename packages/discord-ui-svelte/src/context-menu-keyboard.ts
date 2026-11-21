const pendingActivations = new WeakMap<HTMLElement, () => void>();

/** Let the browser emit its context menu before supplying a keyboard fallback. */
export function contextMenuKeyboard(event: KeyboardEvent): void {
  if (event.target !== event.currentTarget || event.defaultPrevented || event.repeat
    || !(event.key === "ContextMenu" || (event.shiftKey && event.key === "F10"))) {
    return;
  }
  if (!(event.target instanceof HTMLElement))
    return;
  const target = event.target;
  pendingActivations.get(target)?.();
  let timer: ReturnType<typeof setTimeout> | undefined;
  const key = event.key;

  function cleanup(): void {
    clearTimeout(timer);
    target.removeEventListener("contextmenu", cleanup, true);
    target.removeEventListener("keyup", keyup);
    target.removeEventListener("blur", cleanup);
    pendingActivations.delete(target);
  }

  function keyup(released: KeyboardEvent): void {
    if (released.key !== key)
      return;
    target.removeEventListener("keyup", keyup);
    timer = setTimeout(() => {
      cleanup();
      if (event.defaultPrevented || released.defaultPrevented || !target.isConnected || target.ownerDocument.activeElement !== target)
        return;
      const rect = target.getBoundingClientRect();
      target.dispatchEvent(new MouseEvent("contextmenu", {
        button: 2,
        clientX: rect.left,
        clientY: rect.bottom,
        bubbles: true,
        cancelable: true,
      }));
    }, 0);
  }

  pendingActivations.set(target, cleanup);
  target.addEventListener("contextmenu", cleanup, true);
  target.addEventListener("keyup", keyup);
  target.addEventListener("blur", cleanup);
}
