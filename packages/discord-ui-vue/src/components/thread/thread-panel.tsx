import type { ComponentHandlers, MessageView, ReactionToggleHandler, SelectValuesByMessage, ThreadView } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { shallowRef } from "vue";
import { defineRenderer, mountedWatch, state } from "../../rendering";
import { ChannelComposer } from "../channel/channel-composer";
import { ChannelHeader } from "../channel/channel-header";
import { MessageList } from "../channel/message-list";
import { useMessageScroll } from "../channel/use-message-scroll";

type ThreadPanelPropsInput = ComponentHandlers & {
  selectValuesByMessage?: SelectValuesByMessage | undefined;
  thread: ThreadView;
  onReactionToggle?: ReactionToggleHandler | undefined;
  onEphemeralDismiss?: ((messageId: string) => void) | undefined;
  parentMessage?: MessageView | undefined;
  onClose?: (() => void) | undefined;
  onSend?: ((content: string) => void) | undefined;
  composerDisabled?: boolean | undefined;
  autoScroll?: boolean | undefined;
};
export type ThreadPanelProps = ThreadPanelPropsInput;
export type ThreadPanelSlots = Record<string, never>;
export const ThreadPanel = defineRenderer<ThreadPanelProps, ThreadPanelPropsInput, ThreadPanelSlots>("ThreadPanel", [
  "onButtonClick",
  "onSelectChange",
  "onPremiumClick",
  "selectValuesByMessage",
  "thread",
  "onReactionToggle",
  "onEphemeralDismiss",
  "parentMessage",
  "onClose",
  "onSend",
  "composerDisabled",
  "autoScroll",
], [], (input, _display) => {
  return () => {
    const props = input(true);

    return <ThreadPanelContent key={props.thread.id} {...props} />;
  };
});
export type ThreadPanelEmits = { "button-click": Parameters<NonNullable<ThreadPanelProps["onButtonClick"]>>; "select-change": Parameters<NonNullable<ThreadPanelProps["onSelectChange"]>>; "premium-click": Parameters<NonNullable<ThreadPanelProps["onPremiumClick"]>>; "reaction-toggle": Parameters<NonNullable<ThreadPanelProps["onReactionToggle"]>>; "ephemeral-dismiss": Parameters<NonNullable<ThreadPanelProps["onEphemeralDismiss"]>>; "close": Parameters<NonNullable<ThreadPanelProps["onClose"]>>; "send": Parameters<NonNullable<ThreadPanelProps["onSend"]>> };
const ThreadPanelContent = defineRenderer<ThreadPanelPropsInput, ThreadPanelPropsInput, Record<string, never>>("ThreadPanelContent", [
  "onButtonClick",
  "onSelectChange",
  "onPremiumClick",
  "selectValuesByMessage",
  "thread",
  "onReactionToggle",
  "onEphemeralDismiss",
  "parentMessage",
  "onClose",
  "onSend",
  "composerDisabled",
  "autoScroll",
], [], (input, display) => {
  const [draftState, setDraft] = state<string>("");
  const closeRef = shallowRef<HTMLButtonElement | null>(null);
  const { historyRef, updateFollowState } = useMessageScroll(() => (input().thread).id, () => (input().thread).messages.at(-1)?.id ?? (input().parentMessage)?.id, () => (input().autoScroll ?? true));
  function derive(withSlots = false) {
    const { selectValuesByMessage, onEphemeralDismiss, onButtonClick, onSelectChange, onPremiumClick, thread, onReactionToggle, parentMessage, onClose, onSend, composerDisabled = false, autoScroll = true } = input(withSlots);
    const { labels } = display;
    const draft = draftState.value;
    const messages = parentMessage
      ? [parentMessage, ...thread.messages]
      : thread.messages;
    function send(content: string): void {
      onSend?.(content);
      setDraft("");
    }
    return {
      selectValuesByMessage,
      onEphemeralDismiss,
      onButtonClick,
      onSelectChange,
      onPremiumClick,
      thread,
      onReactionToggle,
      parentMessage,
      onClose,
      onSend,
      composerDisabled,
      autoScroll,
      labels,
      draft,
      messages,
      send,
    };
  }
  mountedWatch(() => {
    const { thread } = derive();
    return [thread.id];
  }, () => {
    return (() => {
      closeRef.value?.focus();
    })();
  });
  return () => {
    const { selectValuesByMessage, onEphemeralDismiss, onButtonClick, onSelectChange, onPremiumClick, thread, onReactionToggle, onClose, onSend, composerDisabled, labels, draft, messages, send } = derive(true);
    return (
      <aside
        class="dui-thread-panel"
        aria-label={`${labels.thread} : ${thread.name}`}
        onKeydown={(event) => {
          if (event.key === "Escape" && !event.isComposing && onClose) {
            event.preventDefault();
            onClose();
          }
        }}
      >
        <ChannelHeader
          name={thread.name}
          v-slots={{
            actions: () => onClose
              ? <button type="button" class="dui-thread-close" ref={closeRef} onClick={onClose} aria-label={labels.closeThread}><svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="m6 6 12 12M6 18 18 6" stroke="currentColor" stroke-width="2" stroke-linecap="round" /></svg></button>
              : undefined,
          }}
        />
        <div class="dui-channel-history" role="log" aria-label={`${labels.thread} : ${thread.name}`} aria-live="polite" tabindex={0} ref={historyRef} onScroll={event => updateFollowState((event.currentTarget as HTMLInputElement & HTMLFormElement & HTMLDivElement))}>
          <MessageList selectValuesByMessage={selectValuesByMessage} onEphemeralDismiss={onEphemeralDismiss} onButtonClick={onButtonClick} onSelectChange={onSelectChange} onPremiumClick={onPremiumClick} onReactionToggle={onReactionToggle} messages={messages} showThreadPreviews={false} />
        </div>
        <ChannelComposer channelName={thread.name} modelValue={draft} onUpdate:modelValue={setDraft} onSend={onSend ? send : undefined} disabled={composerDisabled} />
      </aside>
    );
  };
});
