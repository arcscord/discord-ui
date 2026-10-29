import type { CSSProperties, ReactNode } from "react";
import type { ChannelViewModel } from "../../model/channel";
import { useEffect, useRef, useState } from "react";
import { DiscordUI } from "../discord-ui";
import { useDisplayOptions } from "../display-context";
import { ThreadPanel } from "../thread/thread-panel";
import { ChannelComposer } from "./channel-composer";
import { ChannelHeader } from "./channel-header";
import { MessageList } from "./message-list";
import { useMessageScroll } from "./use-message-scroll";

export type ChannelViewProps = {
  channel: ChannelViewModel;
  height?: CSSProperties["height"];
  header?: ReactNode;
  composer?: ReactNode | false;
  onSend?: ((content: string) => void) | undefined;
  onThreadSend?: ((threadId: string, content: string) => void) | undefined;
  composerDisabled?: boolean;
  autoScroll?: boolean;
  showDateSeparators?: boolean;
};

export function ChannelView({ channel, height = 560, header, composer, onSend, onThreadSend, composerDisabled = false, autoScroll = true, showDateSeparators = true }: ChannelViewProps) {
  const { scoped, labels } = useDisplayOptions();
  const [draft, setDraft] = useState("");
  const { historyRef, updateFollowState } = useMessageScroll(channel.id, channel.messages.at(-1)?.id, autoScroll);
  const [selection, setSelection] = useState<{ channelId: string; threadId: string }>();
  const openerRef = useRef<HTMLElement | null>(null);
  const restoreFocusRef = useRef(false);
  const availableThreads = channel.threads?.filter(thread => channel.messages.some(message => message.id === thread.parentMessageId && message.thread?.id === thread.id)) ?? [];
  const open = selection?.channelId === channel.id
    ? availableThreads.find(thread => thread.id === selection.threadId)
    : undefined;
  useEffect(() => {
    if (!open && restoreFocusRef.current) {
      restoreFocusRef.current = false;
      if (openerRef.current?.isConnected)
        openerRef.current.focus();
      else historyRef.current?.focus();
    }
  }, [open, historyRef]);
  function closeThread(): void {
    restoreFocusRef.current = true;
    setSelection(undefined);
  }
  function openThread(id: string): void {
    openerRef.current = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
    setSelection({ channelId: channel.id, threadId: id });
  }

  function send(content: string): void {
    onSend?.(content);
    setDraft("");
  }
  const content = (
    <section className="dui-channel" style={{ height }} aria-label={`#${channel.name}`}>
      <div className={`dui-channel-layout${open ? " dui-has-thread" : ""}`}>
        <div className="dui-channel-main">
          {header ?? <ChannelHeader name={channel.name} topic={channel.topic} />}
          <div
            className="dui-channel-history"
            ref={historyRef}
            role="log"
            aria-label={labels.messages}
            aria-live="polite"
            tabIndex={0}
            onScroll={event => updateFollowState(event.currentTarget)}
          >
            <MessageList messages={channel.messages} showDateSeparators={showDateSeparators} onThreadOpen={openThread} activeThreadId={open?.id} availableThreadIds={availableThreads.map(thread => thread.id)} />
          </div>
          {composer === false
            ? null
            : composer ?? <ChannelComposer channelName={channel.name} value={draft} onValueChange={setDraft} onSend={onSend ? send : undefined} disabled={composerDisabled} />}
        </div>
        {open
          ? (
              <ThreadPanel
                key={open.id}
                thread={open}
                parentMessage={channel.messages.find(message => message.id === open.parentMessageId)}
                onClose={closeThread}
                onSend={onThreadSend
                  ? content => onThreadSend(open.id, content)
                  : undefined}
                composerDisabled={composerDisabled}
                autoScroll={autoScroll}
              />
            )
          : null}
      </div>
    </section>
  );
  return scoped
    ? content
    : <DiscordUI>{content}</DiscordUI>;
}
