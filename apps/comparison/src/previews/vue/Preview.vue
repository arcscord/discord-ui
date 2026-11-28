<script setup lang="ts">
import type { ComponentInteractionContext, MessageInteractionHandlers } from "@arcscord/discord-ui-vue";
import type { ComparisonConfig } from "../../../../../fixtures/comparison/scenarios";
import type { NativeEvent, Snapshot } from "../protocol";
import { ChannelHeader, ChannelList, ChannelView, DiscordUI, Message, MessageList, SelectMenu } from "@arcscord/discord-ui-vue";
import { renderHighlightedCode } from "@arcscord/discord-ui-vue/highlight";
import { computed, defineComponent, h, ref, watchEffect } from "vue";
import { appendMessage, channelListCategories, channelListMenu, classicExtras, classicMessage, commands, comparisonChannelIconPaths, createLocalState, displayOptions, interactionMessage, scenarioMessage, scenarioMessages, standaloneUtilityMessage, utilityMessages } from "../../../../../fixtures/comparison/scenarios";
import { snapshot, utilityEvent } from "../protocol";
import "@arcscord/discord-ui-vue/styles.css";

const props = defineProps<{ config: ComparisonConfig; report: (state: Snapshot) => void; event: (event: NativeEvent, state: Snapshot) => void }>();
const state = ref(createLocalState(props.config.scenario));
function comparisonIcon(key: keyof typeof comparisonChannelIconPaths) {
  return defineComponent({
    name: `Comparison${key}Icon`,
    setup: () => () => h("svg", {
      "viewBox": "0 0 24 24",
      "fill": "none",
      "data-comparison-icon": key,
    }, [
      h("path", {
        "d": comparisonChannelIconPaths[key],
        "stroke": "currentColor",
        "stroke-width": 2,
        "stroke-linecap": "round",
        "stroke-linejoin": "round",
      }),
    ]),
  });
}
const channelIcons = {
  channelTypes: {
    support: comparisonIcon("support"),
    13: comparisonIcon("stage"),
    42: comparisonIcon("numeric"),
  },
  rules: comparisonIcon("rules"),
  locked: comparisonIcon("locked"),
};
const channelListHandlers = computed(() => ({
  onChannelClick: state.value.channelList?.interactive ? channelClick : undefined,
}));
function channelClick(id: string): void {
  if (!state.value.channelList)
    return;
  state.value.channelList.activeChannelId = id;
  props.event({
    name: "channel-click",
    args: [id],
  }, snapshot(state.value));
}
function toggleChannelNavigation(): void {
  if (!state.value.channelList)
    return;
  state.value.channelList.interactive = !state.value.channelList.interactive;
  props.event({
    name: "host-update",
    args: ["channel-navigation", state.value.channelList.interactive],
  }, snapshot(state.value));
}
function toggleChannelIcons(): void {
  if (!state.value.channelList)
    return;
  state.value.channelList.customIcons = !state.value.channelList.customIcons;
  props.event({
    name: "host-update",
    args: ["channel-icons", state.value.channelList.customIcons],
  }, snapshot(state.value));
}
const utilityMode = ref(0);
const utilityRecords = computed(() => utilityMessages(state.value.reacted));
const utilityHandlers = computed<MessageInteractionHandlers>(() => ({
  onUserClick: utilityMode.value === 2
    ? undefined
    : (target, event) => props.event(utilityEvent("user-click", target, event, false), snapshot(state.value)),
  onUserContextMenu: utilityMode.value === 1
    ? undefined
    : (target, event) => props.event(utilityEvent("user-context-menu", target, event, state.value.reacted), snapshot(state.value)),
  onMentionClick: utilityMode.value === 2
    ? undefined
    : (target, event) => props.event(utilityEvent("mention-click", target, event, false), snapshot(state.value)),
  onMentionContextMenu: utilityMode.value === 1
    ? undefined
    : (target, event) => props.event(utilityEvent("mention-context-menu", target, event, state.value.reacted), snapshot(state.value)),
  onMessageContextMenu: (target, event) => props.event(utilityEvent("message-context-menu", target, event, state.value.reacted), snapshot(state.value)),
}));
const origin = window.location.origin;
watchEffect(() => props.report(snapshot(state.value)));
const message = computed(() => ({
  ...(props.config.scenario === "reactions"
    ? scenarioMessages.reactions
    : classicMessage),
  reactions: [
    {
      id: "wave",
      emoji: { name: "👋" },
      count: state.value.reacted ? 2 : 1,
      me: state.value.reacted,
    },
  ],
}));
function button(id: string, context: ComponentInteractionContext): void {
  state.value.waves++;
  props.event({
    name: "button-click",
    args: [id, context],
  }, snapshot(state.value));
}
function select(id: string, values: string[], context: ComponentInteractionContext): void {
  state.value.selectValues = { ...state.value.selectValues, [id]: values };
  props.event({
    name: "select-change",
    args: [id, values, context],
  }, snapshot(state.value));
}
function react(messageId: string, reactionId: string): void {
  state.value.reacted = !state.value.reacted;
  props.event({
    name: "reaction-toggle",
    args: [messageId, reactionId],
  }, snapshot(state.value));
}
function hostUpdate(mode: string): void {
  if (mode === "selects") {
    state.value.selectsDisabled = !state.value.selectsDisabled;
  }
  else if (mode === "reaction") {
    state.value.reacted = !state.value.reacted;
  }
  else {
    state.value.ownershipMode = [
      "defaults",
      "empty",
      "external",
      "identity",
    ].indexOf(mode);
    state.value.selectValues = {
      ...state.value.selectValues,
      ownership: mode === "empty"
        ? []
        : mode === "external"
          ? ["gear"]
          : undefined,
    };
  }
  props.event({
    name: "host-update",
    args: mode === "selects"
      ? [mode, state.value.selectsDisabled]
      : mode === "reaction"
        ? [mode, state.value.reacted]
        : [mode],
  }, snapshot(state.value));
}
function dismiss(id: string): void {
  state.value.dismissed = true;
  props.event({
    name: "ephemeral-dismiss",
    args: [id],
  }, snapshot(state.value));
}
function thread(id: string | null): void {
  state.value.activeThreadId = id;
  props.event({
    name: id === null
      ? "thread-close"
      : "thread-open",
    args: id === null
      ? []
      : [id],
  }, snapshot(state.value));
}
function send(content: string, threadId?: string): void {
  state.value.channel = appendMessage(state.value.channel, content, threadId);
  props.event({
    name: threadId ? "thread-send" : "send",
    args: threadId
      ? [threadId, content]
      : [content],
  }, snapshot(state.value));
}
</script>

<template>
  <DiscordUI v-bind="displayOptions(config, origin)" :icons="config.scenario === 'channel-list' && state.channelList?.customIcons ? channelIcons : undefined" :render-code="config.scenario === 'markdown' ? renderHighlightedCode : undefined">
    <template v-if="config.scenario === 'channel-list'">
      <div class="channel-list-controls">
        <button type="button" @click="toggleChannelNavigation">
          Toggle navigation
        </button>
        <button type="button" @click="toggleChannelIcons">
          Toggle custom icons
        </button>
      </div>
      <ChannelHeader name="Icon preview" channel-type="support" :locked="true" />
      <ChannelList :categories="channelListCategories" label="Server channels" :active-channel-id="state.channelList?.activeChannelId" v-bind="channelListHandlers" />
      <SelectMenu :menu="channelListMenu" />
    </template>
    <template v-else-if="config.scenario === 'utility-interactions'">
      <button type="button" @click="state.reacted = !state.reacted">
        Update utility targets
      </button>
      <button type="button" @click="utilityMode = (utilityMode + 1) % 3">
        Cycle utility handlers
      </button>
      <MessageList
        :messages="utilityRecords"
        v-bind="utilityHandlers"
        @thread-open="thread"
      />
    </template>
    <ChannelView v-else-if="config.scenario === 'channel' || config.scenario === 'threads-commands'" :channel="state.channel" :height="844" :active-thread-id="state.activeThreadId" :commands="commands" @thread-open="thread" @thread-close="thread(null)" @send="send" @thread-send="(id, content) => send(content, id)" @slash-command="invocation => event({ name: 'slash-command', args: [invocation] }, snapshot(state))" />
    <Message v-else-if="config.scenario === 'interactions'" :message="interactionMessage" :select-values="state.selectValues" @select-change="select" @button-click="button" />
    <template v-else-if="config.scenario === 'classic' || config.scenario === 'reactions'">
      <button v-if="config.scenario === 'reactions'" type="button" @click="hostUpdate('reaction')">
        Update reactions
      </button><Message :message="message" @reaction-toggle="react" /><template v-if="config.scenario === 'classic'">
        <Message v-for="extra in classicExtras.filter(item => !state.dismissed || !item.ephemeral)" :key="extra.id" :message="extra" @ephemeral-dismiss="dismiss" />
      </template>
    </template>
    <template v-else>
      <template v-if="config.scenario === 'selection-ownership'">
        <button v-for="mode in ['defaults', 'empty', 'external', 'identity']" :key="mode" type="button" @click="hostUpdate(mode)">
          Ownership {{ mode }}
        </button>
      </template>
      <button v-if="config.scenario === 'selects'" type="button" @click="hostUpdate('selects')">
        Disable selects
      </button>
      <Message :message="scenarioMessage(config.scenario, state, origin)" :select-values="state.selectValues" @select-change="select" @button-click="button" @premium-click="(sku, context) => event({ name: 'premium-click', args: [sku, context] }, snapshot(state))" />
    </template>
  </DiscordUI>
  <div v-if="config.scenario === 'utility-interactions'" data-testid="standalone-utility">
    <Message :message="standaloneUtilityMessage" @message-context-menu="(target, event) => props.event(utilityEvent('message-context-menu', target, event, true), snapshot(state))" />
  </div>
</template>
