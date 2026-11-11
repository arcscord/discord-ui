import type { ChannelViewModel, ComponentHandlers, ReactionToggleHandler, SelectValuesByMessage, SlashCommand, SlashCommandHandler } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { CSSProperties, VNodeChild } from "vue";
import { shallowRef } from "vue";
import { defineRenderer, mountedWatch, state, styleValue } from "../../rendering";
import { DiscordUI } from "../discord-ui";
import { ThreadPanel } from "../thread/thread-panel";
import { ChannelComposer } from "./channel-composer";
import { ChannelHeader } from "./channel-header";
import { MessageList } from "./message-list";
import { useMessageScroll } from "./use-message-scroll";

type ChannelViewPropsInput = ComponentHandlers & {
  "onUpdate:activeThreadId"?: ((id: string | null) => void) | undefined;
  "selectValuesByMessage"?: SelectValuesByMessage | undefined;
  "channel": ChannelViewModel;
  "onReactionToggle"?: ReactionToggleHandler | undefined;
  "onEphemeralDismiss"?: ((messageId: string) => void) | undefined;
  "height"?: CSSProperties["height"];
  "header"?: VNodeChild;
  "composer"?: VNodeChild | false;
  "onSend"?: ((content: string) => void) | undefined;
  /** Omit for local navigation; null explicitly closes the controlled thread. */
  "activeThreadId"?: string | null | undefined;
  "onThreadOpen"?: ((threadId: string) => void) | undefined;
  "onThreadClose"?: (() => void) | undefined;
  "onThreadSend"?: ((threadId: string, content: string) => void) | undefined;
  "commands"?: readonly SlashCommand[];
  "onSlashCommand"?: SlashCommandHandler;
  "composerDisabled"?: boolean;
  "autoScroll"?: boolean;
  "showDateSeparators"?: boolean;
};
export type ChannelViewProps = Omit<ChannelViewPropsInput, "header" | "composer"> & { composer?: false };
export type ChannelViewSlots = { header?: () => VNodeChild; composer?: () => VNodeChild };
export const ChannelView = defineRenderer<ChannelViewProps, ChannelViewPropsInput, ChannelViewSlots>("ChannelView", [
  "onButtonClick",
  "onSelectChange",
  "onPremiumClick",
  "selectValuesByMessage",
  "channel",
  "onReactionToggle",
  "onEphemeralDismiss",
  "height",
  "onSend",
  "activeThreadId",
  "onUpdate:activeThreadId",
  "onThreadOpen",
  "onThreadClose",
  "onThreadSend",
  "commands",
  "onSlashCommand",
  "composerDisabled",
  "autoScroll",
  "showDateSeparators",
  "composer",
], ["header", "composer"], (input, _display) => {
  return () => {
    const props = input(true);

    return <ChannelViewContent key={props.channel.id} {...props} />;
  };
});
export type ChannelViewEmits = {
  "update:activeThreadId": [id: string | null];
  "button-click": Parameters<NonNullable<ChannelViewProps["onButtonClick"]>>;
  "select-change": Parameters<NonNullable<ChannelViewProps["onSelectChange"]>>;
  "premium-click": Parameters<NonNullable<ChannelViewProps["onPremiumClick"]>>;
  "reaction-toggle": Parameters<NonNullable<ChannelViewProps["onReactionToggle"]>>;
  "ephemeral-dismiss": Parameters<NonNullable<ChannelViewProps["onEphemeralDismiss"]>>;
  "send": Parameters<NonNullable<ChannelViewProps["onSend"]>>;
  "thread-open": Parameters<NonNullable<ChannelViewProps["onThreadOpen"]>>;
  "thread-close": Parameters<NonNullable<ChannelViewProps["onThreadClose"]>>;
  "thread-send": Parameters<NonNullable<ChannelViewProps["onThreadSend"]>>;
  "slash-command": Parameters<NonNullable<ChannelViewProps["onSlashCommand"]>>;
};
const ChannelViewContent = defineRenderer<ChannelViewPropsInput, ChannelViewPropsInput, Record<string, never>>("ChannelViewContent", [
  "onButtonClick",
  "onSelectChange",
  "onPremiumClick",
  "selectValuesByMessage",
  "channel",
  "onReactionToggle",
  "onEphemeralDismiss",
  "height",
  "header",
  "composer",
  "onSend",
  "activeThreadId",
  "onUpdate:activeThreadId",
  "onThreadOpen",
  "onThreadClose",
  "onThreadSend",
  "commands",
  "onSlashCommand",
  "composerDisabled",
  "autoScroll",
  "showDateSeparators",
], [], (input, display) => {
  const [draftState, setDraft] = state<string>("");
  const { historyRef, updateFollowState } = useMessageScroll(() => (input().channel).id, () => (input().channel).messages.at(-1)?.id, () => (input().autoScroll ?? true));
  const [selectionState, setSelection] = state<string | undefined>(undefined);
  const openerRef = shallowRef<HTMLElement | null | null>(null);
  const restoreFocusRef = shallowRef(false);
  function derive(withSlots = false) {
    const { selectValuesByMessage, onEphemeralDismiss, onButtonClick, onSelectChange, onPremiumClick, channel, activeThreadId, onThreadOpen, onThreadClose, onReactionToggle, height = 560, header, composer, onSend, onThreadSend, commands, onSlashCommand, composerDisabled = false, autoScroll = true, showDateSeparators = true } = input(withSlots);
    const { scoped, labels } = display;
    const draft = draftState.value;
    const selection = selectionState.value;
    const availableThreads = channel.threads?.filter(thread => channel.messages.some(message => message.id === thread.parentMessageId && message.thread?.id === thread.id)) ?? [];
    const selectedThreadId = activeThreadId !== undefined
      ? activeThreadId
      : selection;
    const open = availableThreads.find(thread => thread.id === selectedThreadId);
    function closeThread(): void {
      input()["onUpdate:activeThreadId"]?.(null);
      restoreFocusRef.value = true;
      if (activeThreadId === undefined)
        setSelection(undefined);
      onThreadClose?.();
    }
    function openThread(id: string): void {
      input()["onUpdate:activeThreadId"]?.(id);
      openerRef.value = document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
      if (activeThreadId === undefined)
        setSelection(id);
      onThreadOpen?.(id);
    }
    function send(content: string): void {
      onSend?.(content);
      setDraft("");
    }
    const content = (
      <section class="dui-channel" style={styleValue({ height })} aria-label={`#${channel.name}`}>
        <div class={`dui-channel-layout${open ? " dui-has-thread" : ""}`}>
          <div class="dui-channel-main">
            {header ?? <ChannelHeader name={channel.name} topic={channel.topic} />}
            <div class="dui-channel-history" ref={historyRef} role="log" aria-label={labels.messages} aria-live="polite" tabindex={0} onScroll={event => updateFollowState((event.currentTarget as HTMLInputElement & HTMLFormElement & HTMLDivElement))}>
              <MessageList selectValuesByMessage={selectValuesByMessage} onEphemeralDismiss={onEphemeralDismiss} onButtonClick={onButtonClick} onSelectChange={onSelectChange} onPremiumClick={onPremiumClick} onReactionToggle={onReactionToggle} messages={channel.messages} showDateSeparators={showDateSeparators} onThreadOpen={openThread} activeThreadId={open?.id} availableThreadIds={availableThreads.map(thread => thread.id)} />
            </div>
            {composer === false
              ? null
              : composer ?? <ChannelComposer key={channel.id} commands={commands} onSlashCommand={onSlashCommand} channelName={channel.name} modelValue={draft} onUpdate:modelValue={setDraft} onSend={onSend ? send : undefined} disabled={composerDisabled} />}
          </div>
          {open
            ? (
                <ThreadPanel
                  selectValuesByMessage={selectValuesByMessage}
                  onEphemeralDismiss={onEphemeralDismiss}
                  onButtonClick={onButtonClick}
                  onSelectChange={onSelectChange}
                  onPremiumClick={onPremiumClick}
                  key={open.id}
                  thread={open}
                  onReactionToggle={onReactionToggle}
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
    return {
      selectValuesByMessage,
      onEphemeralDismiss,
      onButtonClick,
      onSelectChange,
      onPremiumClick,
      channel,
      activeThreadId,
      onThreadOpen,
      onThreadClose,
      onReactionToggle,
      height,
      header,
      composer,
      onSend,
      onThreadSend,
      commands,
      onSlashCommand,
      composerDisabled,
      autoScroll,
      showDateSeparators,
      scoped,
      labels,
      draft,
      selection,
      availableThreads,
      selectedThreadId,
      open,
      closeThread,
      openThread,
      send,
      content,
    };
  }
  mountedWatch(() => {
    const { open } = derive();
    return [open, historyRef];
  }, () => {
    const { open } = derive();
    return (() => {
      if (!open && restoreFocusRef.value) {
        restoreFocusRef.value = false;
        if (openerRef.value?.isConnected)
          openerRef.value.focus();
        else
          historyRef.value?.focus();
      }
    })();
  });
  return () => {
    const { scoped, content } = derive(true);
    return scoped
      ? content
      : <DiscordUI>{content}</DiscordUI>;
  };
});
