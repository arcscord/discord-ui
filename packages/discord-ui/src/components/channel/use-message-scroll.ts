import type { RefObject } from "react";
import { useEffect, useRef } from "react";

export function useMessageScroll(conversationId: string, lastId: string | undefined, autoScroll: boolean): { historyRef: RefObject<HTMLDivElement | null>; updateFollowState: (element: HTMLDivElement) => void } {
  const historyRef = useRef<HTMLDivElement>(null);
  const followingRef = useRef(true);
  const wasEnabledRef = useRef(false);
  useEffect(() => {
    const history = historyRef.current;
    if (!autoScroll || !history) {
      wasEnabledRef.current = false;
      return;
    }
    if (!wasEnabledRef.current)
      followingRef.current = true;
    wasEnabledRef.current = true;
    const scrollToBottom = (): void => {
      if (followingRef.current)
        history.scrollTop = history.scrollHeight;
    };
    scrollToBottom();
    if (typeof ResizeObserver === "undefined" || !history.firstElementChild)
      return;
    const observer = new ResizeObserver(scrollToBottom);
    observer.observe(history.firstElementChild);
    observer.observe(history);
    return () => observer.disconnect();
  }, [autoScroll, conversationId, lastId]);
  function updateFollowState(element: HTMLDivElement): void {
    followingRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 24;
  }
  return { historyRef, updateFollowState };
}
