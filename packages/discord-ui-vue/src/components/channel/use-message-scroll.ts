import { onBeforeUnmount, onMounted, shallowRef, watch } from "vue";

export function useMessageScroll(conversationId: () => string, lastId: () => string | undefined, autoScroll: () => boolean) {
  const historyRef = shallowRef<HTMLDivElement | null>(null);
  let following = true;
  let wasEnabled = false;
  let observer: ResizeObserver | undefined;
  let stop: (() => void) | undefined;
  function updateFollowState(element: HTMLDivElement): void {
    following = element.scrollHeight - element.scrollTop - element.clientHeight < 24;
  }
  onMounted(() => {
    stop = watch([autoScroll, conversationId, lastId], ([enabled]) => {
      observer?.disconnect();
      const history = historyRef.value;
      if (!enabled || !history) {
        wasEnabled = false;
        return;
      }
      if (!wasEnabled)
        following = true;
      wasEnabled = true;
      const scrollToBottom = (): void => {
        if (following)
          history.scrollTop = history.scrollHeight;
      };
      scrollToBottom();
      if (typeof ResizeObserver === "undefined" || !history.firstElementChild)
        return;
      observer = new ResizeObserver(scrollToBottom);
      observer.observe(history.firstElementChild);
      observer.observe(history);
    }, { immediate: true, flush: "post" });
  });
  onBeforeUnmount(() => {
    stop?.();
    observer?.disconnect();
  });
  return { historyRef, updateFollowState };
}
