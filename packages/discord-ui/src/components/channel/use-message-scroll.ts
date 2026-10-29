import type { RefObject } from "react";
import { useEffect, useRef } from "react";

export function useMessageScroll(conversationId: string, lastId: string | undefined, autoScroll: boolean): { historyRef: RefObject<HTMLDivElement | null>; updateFollowState: (element: HTMLDivElement) => void } {
  const historyRef = useRef<HTMLDivElement>(null);
  const followingRef = useRef(true);
  useEffect(() => {
    const history = historyRef.current;
    if (!autoScroll || !history)
      return;
    followingRef.current = true;
    const scrollToBottom = (): void => {
      history.scrollTop = history.scrollHeight;
    };
    scrollToBottom();
    if (typeof ResizeObserver === "undefined" || !history.firstElementChild)
      return;
    const observer = new ResizeObserver(() => {
      if (followingRef.current)
        scrollToBottom();
    });
    observer.observe(history.firstElementChild);
    return () => observer.disconnect();
  }, [autoScroll, conversationId, lastId]);
  function updateFollowState(element: HTMLDivElement): void {
    followingRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 24;
  }
  return { historyRef, updateFollowState };
}
