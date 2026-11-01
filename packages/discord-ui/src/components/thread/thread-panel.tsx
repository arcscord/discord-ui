import type { ComponentHandlers } from "../../model/components";
import type { MessageView } from "../../model/message";
import type { ReactionToggleHandler } from "../../model/reaction";
import type { ThreadView } from "../../model/thread";
import { useEffect, useRef, useState } from "react";
import { ChannelComposer } from "../channel/channel-composer";
import { ChannelHeader } from "../channel/channel-header";
import { MessageList } from "../channel/message-list";
import { useMessageScroll } from "../channel/use-message-scroll";
import { useDisplayOptions } from "../display-context";

export type ThreadPanelProps = ComponentHandlers & {
  thread: ThreadView;
  onReactionToggle?: ReactionToggleHandler | undefined;
  parentMessage?: MessageView | undefined;
  onClose?: (() => void) | undefined;
  onSend?: ((content: string) => void) | undefined;
  composerDisabled?: boolean | undefined;
  autoScroll?: boolean | undefined;
};

export function ThreadPanel({ onButtonClick, onSelectChange, onPremiumClick, thread, onReactionToggle, parentMessage, onClose, onSend, composerDisabled = false, autoScroll = true }: ThreadPanelProps) {
  const { labels } = useDisplayOptions();
  const [draft, setDraft] = useState("");
  const closeRef = useRef<HTMLButtonElement>(null);
  const { historyRef, updateFollowState } = useMessageScroll(thread.id, thread.messages.at(-1)?.id ?? parentMessage?.id, autoScroll);
  useEffect(() => {
    closeRef.current?.focus();
  }, [thread.id]);
  const messages = parentMessage
    ? [parentMessage, ...thread.messages]
    : thread.messages;
  function send(content: string): void {
    onSend?.(content);
    setDraft("");
  }
  return (
    <aside
      className="dui-thread-panel"
      aria-label={`${labels.thread} : ${thread.name}`}
      onKeyDown={(event) => {
        if (event.key === "Escape" && !event.nativeEvent.isComposing && onClose) {
          event.preventDefault();
          onClose();
        }
      }}
    >
      <ChannelHeader
        name={thread.name}
        actions={onClose
          ? <button type="button" className="dui-thread-close" ref={closeRef} onClick={onClose} aria-label={labels.closeThread}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg></button>
          : undefined}
      />
      <div className="dui-channel-history" role="log" aria-label={`${labels.thread} : ${thread.name}`} aria-live="polite" tabIndex={0} ref={historyRef} onScroll={event => updateFollowState(event.currentTarget)}>
        <MessageList onButtonClick={onButtonClick} onSelectChange={onSelectChange} onPremiumClick={onPremiumClick} onReactionToggle={onReactionToggle} messages={messages} showThreadPreviews={false} />
      </div>
      <ChannelComposer channelName={thread.name} value={draft} onValueChange={setDraft} onSend={onSend ? send : undefined} disabled={composerDisabled} />
    </aside>
  );
}
