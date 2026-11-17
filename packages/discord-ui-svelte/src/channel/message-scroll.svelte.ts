/** Called inside a keyed conversation, so follow state starts fresh on navigation. */
export function trackMessageScroll(history: () => HTMLDivElement | undefined, lastId: () => string | undefined, autoScroll: () => boolean): (event: Event & { currentTarget: HTMLDivElement }) => void {
  let following = true;
  let wasEnabled = false;

  $effect(() => {
    const element = history();
    const enabled = autoScroll();
    lastId();

    if (!enabled || !element) {
      wasEnabled = false;
      return;
    }
    if (!wasEnabled)
      following = true;
    wasEnabled = true;

    function scrollToBottom(): void {
      if (element && following)
        element.scrollTop = element.scrollHeight;
    }

    scrollToBottom();
    const content = element.firstElementChild;
    if (typeof ResizeObserver === "undefined" || !content)
      return;
    const observer = new ResizeObserver(scrollToBottom);
    observer.observe(content);
    observer.observe(element);
    return () => observer.disconnect();
  });

  return ({ currentTarget }) => {
    following = currentTarget.scrollHeight - currentTarget.scrollTop - currentTarget.clientHeight < 24;
  };
}
