<script setup lang="ts">
import type { ComponentInteractionContext } from "@arcscord/discord-ui-vue";
import type { ComparisonConfig } from "../../../../../fixtures/comparison/scenarios";
import type { NativeEvent, Snapshot } from "../protocol";
import { ChannelView, DiscordUI, Message } from "@arcscord/discord-ui-vue";
import { computed, ref, watchEffect } from "vue";
import { appendMessage, classicMessage, createLocalState, displayOptions, interactionMessage } from "../../../../../fixtures/comparison/scenarios";
import { snapshot } from "../protocol";
import "@arcscord/discord-ui-vue/styles.css";

const props = defineProps<{ config: ComparisonConfig; report: (state: Snapshot) => void; event: (event: NativeEvent, state: Snapshot) => void }>();
const state = ref(createLocalState());
watchEffect(() => props.report(snapshot(state.value)));
const message = computed(() => ({
  ...classicMessage,
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
  <DiscordUI v-bind="displayOptions(config)">
    <ChannelView v-if="config.scenario === 'channel'" :channel="state.channel" :height="844" :active-thread-id="state.activeThreadId" @thread-open="thread" @thread-close="thread(null)" @send="send" @thread-send="(id, content) => send(content, id)" />
    <Message v-else-if="config.scenario === 'interactions'" :message="interactionMessage" :select-values="state.selectValues" @select-change="select" @button-click="button" />
    <Message v-else :message="message" @reaction-toggle="react" />
  </DiscordUI>
</template>
