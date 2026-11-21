import type { ComponentInteractionContext } from "@arcscord/discord-ui";
import type { ComparisonConfig } from "../../../../fixtures/comparison/scenarios";
import type { Snapshot } from "./protocol";
import { ChannelView, DiscordUI, Message, MessageList } from "@arcscord/discord-ui";
import { renderHighlightedCode } from "@arcscord/discord-ui/highlight";
import { useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { appendMessage, classicExtras, classicMessage, commands, createLocalState, displayOptions, interactionMessage, scenarioMessage, scenarioMessages, standaloneUtilityMessage, utilityMessages } from "../../../../fixtures/comparison/scenarios";
import { snapshot, utilityEvent } from "./protocol";
import { frameRuntime } from "./runtime";
import "@arcscord/discord-ui/styles.css";

const runtime = frameRuntime("react");
export function Preview({ config, report }: { config: ComparisonConfig; report: (state: Snapshot) => void }) {
  const [state, setState] = useState(createLocalState);
  const [utilityMode, setUtilityMode] = useState(0);
  useLayoutEffect(() => report(snapshot(state)), [config, report, state]);
  function button(id: string, context: ComponentInteractionContext): void {
    const next = { ...state, waves: state.waves + 1 };
    setState(next);
    runtime.event({
      name: "button-click",
      args: [id, context],
    }, snapshot(next));
  }
  function select(id: string, values: string[], context: ComponentInteractionContext): void {
    const next = {
      ...state,
      selectValues: { ...state.selectValues, [id]: values },
    };
    setState(next);
    runtime.event({
      name: "select-change",
      args: [id, values, context],
    }, snapshot(next));
  }
  function react(messageId: string, reactionId: string): void {
    const next = { ...state, reacted: !state.reacted };
    setState(next);
    runtime.event({
      name: "reaction-toggle",
      args: [messageId, reactionId],
    }, snapshot(next));
  }
  function thread(id: string | null): void {
    const next = { ...state, activeThreadId: id };
    setState(next);
    runtime.event({
      name: id === null
        ? "thread-close"
        : "thread-open",
      args: id === null
        ? []
        : [id],
    }, snapshot(next));
  }
  function send(content: string, threadId?: string): void {
    const next = {
      ...state,
      channel: appendMessage(state.channel, content, threadId),
    };
    setState(next);
    runtime.event({
      name: threadId ? "thread-send" : "send",
      args: threadId
        ? [threadId, content]
        : [content],
    }, snapshot(next));
  }
  const message = {
    ...(config.scenario === "reactions"
      ? scenarioMessages.reactions
      : classicMessage),
    reactions: [
      {
        id: "wave",
        emoji: { name: "👋" },
        count: state.reacted ? 2 : 1,
        me: state.reacted,
      },
    ],
  };
  return (
    <>
      <DiscordUI
        {...displayOptions(config, window.location.origin)}
        renderCode={config.scenario === "markdown"
          ? renderHighlightedCode
          : undefined}
      >
        {config.scenario === "utility-interactions"
          ? (
              <>
                <button type="button" onClick={() => setState(current => ({ ...current, reacted: !current.reacted }))}>Update utility targets</button>
                <button type="button" onClick={() => setUtilityMode(current => (current + 1) % 3)}>Cycle utility handlers</button>
                <MessageList
                  messages={utilityMessages(state.reacted)}
                  onThreadOpen={thread}
                  onUserClick={utilityMode === 2
                    ? undefined
                    : (target, event) => runtime.event(utilityEvent("user-click", target, event, false), snapshot(state))}
                  onUserContextMenu={utilityMode === 1
                    ? undefined
                    : (target, event) => runtime.event(utilityEvent("user-context-menu", target, event, state.reacted), snapshot(state))}
                  onMentionClick={utilityMode === 2
                    ? undefined
                    : (target, event) => runtime.event(utilityEvent("mention-click", target, event, false), snapshot(state))}
                  onMentionContextMenu={utilityMode === 1
                    ? undefined
                    : (target, event) => runtime.event(utilityEvent("mention-context-menu", target, event, state.reacted), snapshot(state))}
                  onMessageContextMenu={(target, event) => runtime.event(utilityEvent("message-context-menu", target, event, state.reacted), snapshot(state))}
                />
              </>
            )
          : (config.scenario === "channel" || config.scenario === "threads-commands")
              ? (
                  <ChannelView
                    channel={state.channel}
                    height={844}
                    activeThreadId={state.activeThreadId}
                    onThreadOpen={thread}
                    onThreadClose={() => thread(null)}
                    onSend={content => send(content)}
                    onThreadSend={(id, content) => send(content, id)}
                    commands={commands}
                    onSlashCommand={invocation => runtime.event({
                      name: "slash-command",
                      args: [invocation],
                    }, snapshot(state))}
                  />
                )
              : config.scenario === "interactions"
                ? <Message message={interactionMessage} selectValues={state.selectValues} onSelectChange={select} onButtonClick={button} />
                : config.scenario === "classic" || config.scenario === "reactions"
                  ? (
                      <>
                        {config.scenario === "reactions" && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...state, reacted: !state.reacted };
                              setState(next);
                              runtime.event({
                                name: "host-update",
                                args: ["reaction", next.reacted],
                              }, snapshot(next));
                            }}
                          >
                            Update reactions
                          </button>
                        )}
                        <Message message={message} onReactionToggle={react} />
                        {config.scenario === "classic" && classicExtras.filter(extra => !state.dismissed || !extra.ephemeral).map(extra => (
                          <Message
                            key={extra.id}
                            message={extra}
                            onEphemeralDismiss={(id) => {
                              const next = { ...state, dismissed: true };
                              setState(next);
                              runtime.event({
                                name: "ephemeral-dismiss",
                                args: [id],
                              }, snapshot(next));
                            }}
                          />
                        ))}
                      </>
                    )
                  : (
                      <>
                        {config.scenario === "selection-ownership" && [
                          "defaults",
                          "empty",
                          "external",
                          "identity",
                        ].map((mode, index) => (
                          <button
                            type="button"
                            key={mode}
                            onClick={() => {
                              const next = {
                                ...state,
                                ownershipMode: index,
                                selectValues: {
                                  ...state.selectValues,
                                  ownership: index === 1
                                    ? []
                                    : index === 2
                                      ? ["gear"]
                                      : undefined,
                                },
                              };
                              setState(next);
                              runtime.event({
                                name: "host-update",
                                args: [mode],
                              }, snapshot(next));
                            }}
                          >
                            {`Ownership ${mode}`}
                          </button>
                        ))}
                        {config.scenario === "selects" && (
                          <button
                            type="button"
                            onClick={() => {
                              const next = { ...state, selectsDisabled: !state.selectsDisabled };
                              setState(next);
                              runtime.event({
                                name: "host-update",
                                args: ["selects", next.selectsDisabled],
                              }, snapshot(next));
                            }}
                          >
                            Disable selects
                          </button>
                        )}
                        <Message
                          message={scenarioMessage(config.scenario, state, window.location.origin)}
                          selectValues={state.selectValues}
                          onSelectChange={select}
                          onButtonClick={button}
                          onPremiumClick={(sku, context) => runtime.event({
                            name: "premium-click",
                            args: [sku, context],
                          }, snapshot(state))}
                        />
                      </>
                    )}
      </DiscordUI>
      {config.scenario === "utility-interactions" && <div data-testid="standalone-utility"><Message message={standaloneUtilityMessage} onMessageContextMenu={(target, event) => runtime.event(utilityEvent("message-context-menu", target, event, true), snapshot(state))} /></div>}
    </>
  );
}
const root = createRoot(document.querySelector("#app")!, { onUncaughtError: runtime.fail, onCaughtError: runtime.fail });
let generation = 0;
runtime.start({
  configure(config, reset) {
    if (reset)
      generation++;
    return new Promise(resolve => root.render(<Preview key={generation} config={config} report={resolve} />));
  },
  destroy: () => root.unmount(),
});
