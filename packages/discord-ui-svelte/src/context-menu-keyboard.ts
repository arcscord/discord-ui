/** Provide the native context-menu event for keyboard targets across browsers. */
export function contextMenuKeyboard(event: KeyboardEvent): void {
  if (event.defaultPrevented || !(event.key === "ContextMenu" || (event.shiftKey && event.key === "F10")))
    return;
  if (!(event.target instanceof HTMLElement))
    return;
  event.preventDefault();
  event.stopPropagation();
  const target = event.target;
  const rect = target.getBoundingClientRect();
  target.dispatchEvent(new MouseEvent("contextmenu", {
    button: 2,
    clientX: rect.left,
    clientY: rect.bottom,
    bubbles: true,
    cancelable: true,
  }));
}
