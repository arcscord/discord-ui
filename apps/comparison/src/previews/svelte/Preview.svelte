<script lang="ts">
  import type { ComponentInteractionContext } from "@arcscord/discord-ui-svelte";
  import type { ComparisonConfig } from "../../../../../fixtures/comparison/scenarios";
  import type { NativeEvent, Snapshot } from "../protocol";
  import { ChannelView, DiscordUI, Message, MessageList } from "@arcscord/discord-ui-svelte";
  import { HighlightedCode } from "@arcscord/discord-ui-svelte/highlight";
  import { appendMessage, classicExtras, classicMessage, commands, createLocalState, displayOptions, interactionMessage, scenarioMessage, scenarioMessages, standaloneUtilityMessage, utilityMessages } from "../../../../../fixtures/comparison/scenarios";
  import { snapshot, utilityEvent } from "../protocol";
  import "@arcscord/discord-ui-svelte/styles.css";

  const { config, report, event }: { config: ComparisonConfig; report: (localState: Snapshot) => void; event: (event: NativeEvent, localState: Snapshot) => void } = $props();
  const localState = $state(createLocalState());
  let utilityMode = $state(0);
  $effect(() => report(snapshot(localState)));
  const message = $derived({
    ...(config.scenario === "reactions"
      ? scenarioMessages.reactions
      : classicMessage),
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
  function hostUpdate(mode: string): void {
    if (mode === "selects") {
      localState.selectsDisabled = !localState.selectsDisabled;
    }
    else if (mode === "reaction") {
      localState.reacted = !localState.reacted;
    }
    else {
      localState.ownershipMode = [
        "defaults",
        "empty",
        "external",
        "identity",
      ].indexOf(mode);
      localState.selectValues = {
        ...localState.selectValues,
        ownership: mode === "empty"
          ? []
          : mode === "external"
          ? ["gear"]
          : undefined,
      };
    }
    event({
      name: "host-update",
      args: mode === "selects"
        ? [mode, localState.selectsDisabled]
        : mode === "reaction"
        ? [mode, localState.reacted]
        : [mode],
    }, snapshot(localState));
  }
  function dismiss(id: string): void {
    localState.dismissed = true;
    event({
      name: "ephemeral-dismiss",
      args: [id],
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

{#snippet highlighted(content: string, language: string)}<HighlightedCode {content} {language} />{/snippet}
<DiscordUI {...displayOptions(config, window.location.origin)} renderCode={config.scenario === "markdown"
  ? highlighted
  : undefined}>
  {#if config.scenario === "utility-interactions"}
    <button type="button" onclick={() => localState.reacted = !localState.reacted}>Update utility targets</button>
    <button type="button" onclick={() => utilityMode = (utilityMode + 1) % 3}>Cycle utility handlers</button>
    <MessageList messages={utilityMessages(localState.reacted)} onThreadOpen={thread}
                 onUserClick={utilityMode === 2
                   ? undefined
                   : (target, nativeEvent) => event(utilityEvent("user-click", target, nativeEvent, false), snapshot(localState))}
                 onUserContextMenu={utilityMode === 1
                   ? undefined
                   : (target, nativeEvent) => event(utilityEvent("user-context-menu", target, nativeEvent, localState.reacted), snapshot(localState))}
                 onMentionClick={utilityMode === 2
                   ? undefined
                   : (target, nativeEvent) => event(utilityEvent("mention-click", target, nativeEvent, false), snapshot(localState))}
                 onMentionContextMenu={utilityMode === 1
                   ? undefined
                   : (target, nativeEvent) => event(utilityEvent("mention-context-menu", target, nativeEvent, localState.reacted), snapshot(localState))}
                 onMessageContextMenu={(target, nativeEvent) => event(utilityEvent("message-context-menu", target, nativeEvent, localState.reacted), snapshot(localState))} />
  {:else if config.scenario === "channel" || config.scenario === "threads-commands"}
    <ChannelView channel={localState.channel} height={844} activeThreadId={localState.activeThreadId} onThreadOpen={thread} onThreadClose={() => thread(null)} onSend={content => send(content)} onThreadSend={(id, content) => send(content, id)} {commands} onSlashCommand={invocation => event({
      name: "slash-command",
      args: [invocation],
    }, snapshot(localState))} />
  {:else if config.scenario === "interactions"}
    <Message message={interactionMessage} selectValues={localState.selectValues} onSelectChange={select} onButtonClick={button} />
  {:else if config.scenario === "classic" || config.scenario === "reactions"}
    {#if config.scenario === "reactions"}<button type="button" onclick={() => hostUpdate("reaction")}>Update reactions</button>{/if}
    <Message {message} onReactionToggle={react} />
    {#if config.scenario === "classic"}{#each classicExtras.filter(item => !localState.dismissed || !item.ephemeral) as extra (extra.id)}<Message message={extra} onEphemeralDismiss={dismiss} />{/each}{/if}
  {:else}
    {#if config.scenario === "selection-ownership"}{#each [
      "defaults",
      "empty",
      "external",
      "identity",
    ] as mode (mode)}<button type="button" onclick={() => hostUpdate(mode)}>Ownership {mode}</button>{/each}{/if}
    {#if config.scenario === "selects"}<button type="button" onclick={() => hostUpdate("selects")}>Disable selects</button>{/if}
    <Message message={scenarioMessage(config.scenario, localState, window.location.origin)} selectValues={localState.selectValues} onSelectChange={select} onButtonClick={button} onPremiumClick={(sku, context) => event({
      name: "premium-click",
      args: [sku, context],
    }, snapshot(localState))} />
  {/if}
</DiscordUI>

{#if config.scenario === "utility-interactions"}<div data-testid="standalone-utility"><Message message={standaloneUtilityMessage} onMessageContextMenu={(target, nativeEvent) => event(utilityEvent("message-context-menu", target, nativeEvent, true), snapshot(localState))} /></div>{/if}
