<script setup lang="ts">
import type { ChannelViewModel, SlashCommandInvocation } from "@arcscord/discord-ui-vue";
import { ChannelView, DiscordUI } from "@arcscord/discord-ui-vue";
import { ref } from "vue";
import "@arcscord/discord-ui-vue/styles.css";

const activeThreadId = ref<string | null>(null);
const status = ref("Ready");
const channel = ref<ChannelViewModel>({
  id: "vue",
  name: "vue",
  topic: "Vue conversation demo",
  messages: [
    {
      id: "starter",
      author: { id: "bot", displayName: "Vue Bot" },
      timestamp: "2026-11-01T10:24:00Z",
      body: { kind: "text", content: "Open the thread or send a message." },
      thread: { id: "thread", name: "Discussion", messageCount: 0 },
    },
  ],
  threads: [
    {
      id: "thread",
      name: "Discussion",
      parentMessageId: "starter",
      messages: [],
    },
  ],
});
function send(content: string): void {
  const id = `message-${channel.value.messages.length}`;
  channel.value = {
    ...channel.value,
    messages: [
      ...channel.value.messages,
      {
        id,
        author: { id: "you", displayName: "You" },
        timestamp: "2026-11-01T10:25:00Z",
        body: { kind: "text", content },
      },
    ],
  };
}
function threadSend(threadId: string, content: string): void {
  channel.value = {
    ...channel.value,
    threads: (channel.value.threads ?? []).map(thread => thread.id === threadId
      ? {
          ...thread,
          messages: [
            ...thread.messages,
            {
              id: `reply-${thread.messages.length}`,
              author: { id: "you", displayName: "You" },
              timestamp: "2026-11-01T10:25:00Z",
              body: { kind: "text", content },
            },
          ],
        }
      : thread),
  };
}
function command(invocation: SlashCommandInvocation): void {
  status.value = `Command: ${invocation.command.name}; ${invocation.arguments.text ?? ""}`;
}
</script>

<template>
  <DiscordUI theme="dark" reference-time="2026-11-01T10:25:00Z">
    <ChannelView v-model:active-thread-id="activeThreadId" :channel="channel" :height="500" :commands="[{ name: 'echo', description: 'Echo text', arguments: [{ name: 'text', description: 'Text to echo', required: true }] }]" @send="send" @thread-send="threadSend" @slash-command="command" />
    <p role="status">
      {{ status }}
    </p>
  </DiscordUI>
</template>
