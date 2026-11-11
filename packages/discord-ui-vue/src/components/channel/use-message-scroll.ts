import { onBeforeUnmount, onMounted, shallowRef, watch } from "vue";

export function useMessageScroll(conversationId: () => string, lastId: () => string | undefined, autoScroll: () => boolean) {
  const historyRef = shallowRef<HTMLDivElement | null>(null);
  let following = true;
  let observer: ResizeObserver | undefined;
  let stop: (() => void) | undefined;
  function updateFollowState(element: HTMLDivElement): void {
    following = element.scrollHeight - element.scrollTop - element.clientHeight < 24;
  }
  onMounted(() => {
    stop = watch(() => [
      autoScroll(),
      conversationId(),
      lastId(),
    ], () => {
      observer?.disconnect();
      const history = historyRef.value;
      if (!autoScroll() || !history)
        return;
      following = true;
      const scrollToBottom = (): void => {
        history.scrollTop = history.scrollHeight;
      };
      scrollToBottom();
      if (typeof ResizeObserver === "undefined" || !history.firstElementChild)
        return;
      observer = new ResizeObserver(() => {
        if (following)
          scrollToBottom();
      });
      observer.observe(history.firstElementChild);
    }, { immediate: true, flush: "post" });
  });
  onBeforeUnmount(() => {
    stop?.();
    observer?.disconnect();
  });
  return { historyRef, updateFollowState };
}
