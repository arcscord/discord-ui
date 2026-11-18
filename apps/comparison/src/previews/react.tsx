import type { ComponentInteractionContext } from "@arcscord/discord-ui";
import type { ComparisonConfig } from "../../../../fixtures/comparison/scenarios";
import type { Snapshot } from "./protocol";
import { ChannelView, DiscordUI, Message } from "@arcscord/discord-ui";
import { useLayoutEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { appendMessage, classicMessage, createLocalState, displayOptions, interactionMessage } from "../../../../fixtures/comparison/scenarios";
import { snapshot } from "./protocol";
import { frameRuntime } from "./runtime";
import "@arcscord/discord-ui/styles.css";

const runtime = frameRuntime("react");
export function Preview({ config, report }: { config: ComparisonConfig; report: (state: Snapshot) => void }) {
  const [state, setState] = useState(createLocalState);
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
    ...classicMessage,
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
    <DiscordUI {...displayOptions(config)}>
      {config.scenario === "channel"
        ? <ChannelView channel={state.channel} height={844} activeThreadId={state.activeThreadId} onThreadOpen={thread} onThreadClose={() => thread(null)} onSend={content => send(content)} onThreadSend={(id, content) => send(content, id)} />
        : config.scenario === "interactions"
          ? <Message message={interactionMessage} selectValues={state.selectValues} onSelectChange={select} onButtonClick={button} />
          : <Message message={message} onReactionToggle={react} />}
    </DiscordUI>
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
