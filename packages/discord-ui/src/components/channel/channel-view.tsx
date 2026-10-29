import type { CSSProperties, ReactNode } from "react";
import type { ChannelViewModel } from "../../model/channel";
import { useEffect, useRef, useState } from "react";
import { DiscordUI } from "../discord-ui";
import { useDisplayOptions } from "../display-context";
import { ChannelComposer } from "./channel-composer";
import { ChannelHeader } from "./channel-header";
import { MessageList } from "./message-list";

export type ChannelViewProps = {
  channel: ChannelViewModel;
  height?: CSSProperties["height"];
  header?: ReactNode;
  composer?: ReactNode | false;
  onSend?: ((content: string) => void) | undefined;
  composerDisabled?: boolean;
  autoScroll?: boolean;
  showDateSeparators?: boolean;
};

export function ChannelView({ channel, height = 560, header, composer, onSend, composerDisabled = false, autoScroll = true, showDateSeparators = true }: ChannelViewProps) {
  const { scoped, labels } = useDisplayOptions();
  const [draft, setDraft] = useState("");
  const historyRef = useRef<HTMLDivElement>(null);
  const lastId = channel.messages.at(-1)?.id;
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
    // Follow media loading too; do not pull a reader down after they scroll up.
    if (typeof ResizeObserver === "undefined" || !history.firstElementChild)
      return;
    const observer = new ResizeObserver(() => {
      if (followingRef.current)
        scrollToBottom();
    });
    observer.observe(history.firstElementChild);
    return () => observer.disconnect();
  }, [autoScroll, channel.id, lastId]);

  function send(content: string): void {
    onSend?.(content);
    setDraft("");
  }
  const content = (
    <section className="dui-channel" style={{ height }} aria-label={`#${channel.name}`}>
      {header ?? <ChannelHeader name={channel.name} topic={channel.topic} />}
      <div
        className="dui-channel-history"
        ref={historyRef}
        role="log"
        aria-label={labels.messages}
        aria-live="polite"
        tabIndex={0}
        onScroll={(event) => {
          const element = event.currentTarget;
          followingRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 24;
        }}
      >
        <MessageList messages={channel.messages} showDateSeparators={showDateSeparators} />
      </div>
      {composer === false
        ? null
        : composer ?? <ChannelComposer channelName={channel.name} value={draft} onValueChange={setDraft} onSend={onSend ? send : undefined} disabled={composerDisabled} />}
    </section>
  );
  return scoped
    ? content
    : <DiscordUI>{content}</DiscordUI>;
}
