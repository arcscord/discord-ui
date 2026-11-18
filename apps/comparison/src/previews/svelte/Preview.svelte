<script lang="ts">
  import type { ComponentInteractionContext } from "@arcscord/discord-ui-svelte";
  import type { ComparisonConfig } from "../../../../../fixtures/comparison/scenarios";
  import type { NativeEvent, Snapshot } from "../protocol";
  import { ChannelView, DiscordUI, Message } from "@arcscord/discord-ui-svelte";
  import { appendMessage, classicMessage, createLocalState, displayOptions, interactionMessage } from "../../../../../fixtures/comparison/scenarios";
  import { snapshot } from "../protocol";
  import "@arcscord/discord-ui-svelte/styles.css";

  const { config, report, event }: { config: ComparisonConfig; report: (localState: Snapshot) => void; event: (event: NativeEvent, localState: Snapshot) => void } = $props();
  const localState = $state(createLocalState());
  $effect(() => report(snapshot(localState)));
  const message = $derived({
    ...classicMessage,
    reactions: [
      {
        id: "wave",
        emoji: { name: "👋" },
        count: localState.reacted ? 2 : 1,
        me: localState.reacted,
      },
    ],
  });
  function button(id: string, context: ComponentInteractionContext): void {
    localState.waves++;
    event({
      name: "button-click",
      args: [id, context],
    }, snapshot(localState));
  }
  function select(id: string, values: string[], context: ComponentInteractionContext): void {
    localState.selectValues = { ...localState.selectValues, [id]: values };
    event({
      name: "select-change",
      args: [id, values, context],
    }, snapshot(localState));
  }
  function react(messageId: string, reactionId: string): void {
    localState.reacted = !localState.reacted;
    event({
      name: "reaction-toggle",
      args: [messageId, reactionId],
    }, snapshot(localState));
  }
  function thread(id: string | null): void {
    localState.activeThreadId = id;
    event({
      name: id === null
        ? "thread-close"
        : "thread-open",
      args: id === null
        ? []
        : [id],
    }, snapshot(localState));
  }
  function send(content: string, threadId?: string): void {
    localState.channel = appendMessage(localState.channel, content, threadId);
    event({
      name: threadId ? "thread-send" : "send",
      args: threadId
        ? [threadId, content]
        : [content],
    }, snapshot(localState));
  }
</script>

<DiscordUI {...displayOptions(config)}>
  {#if config.scenario === "channel"}
    <ChannelView channel={localState.channel} height={844} activeThreadId={localState.activeThreadId} onThreadOpen={thread} onThreadClose={() => thread(null)} onSend={content => send(content)} onThreadSend={(id, content) => send(content, id)} />
  {:else if config.scenario === "interactions"}
    <Message message={interactionMessage} selectValues={localState.selectValues} onSelectChange={select} onButtonClick={button} />
  {:else}
    <Message {message} onReactionToggle={react} />
  {/if}
</DiscordUI>
