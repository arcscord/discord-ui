<script lang="ts">
  import type { ChannelViewModel, SlashCommand, SlashCommandInvocation, ThreadMessageView } from "@arcscord/discord-ui-svelte";
  import { ChannelView, DiscordUI } from "@arcscord/discord-ui-svelte";
  import "@arcscord/discord-ui-svelte/styles.css";

  const timestamp = "2026-11-01T10:24:00Z";
  const author = { id: "guide", displayName: "Field Guide" };
  const commands: readonly SlashCommand[] = [
    {
      name: "echo",
      description: "Repeat a note with a selected priority",
      arguments: [
        { name: "text", description: "Text to echo", required: true },
        {
          name: "priority",
          description: "Choose a priority",
          choices: [
            { name: "Normal", value: "normal" },
            { name: "High", value: "high" },
          ],
        },
      ],
    },
  ];
  function entry(id: string, content: string): ThreadMessageView {
    return {
      id,
      author,
      timestamp,
      body: { kind: "text", content },
    };
  }

  let activeThreadId = $state<string | null>(null);
  let status = $state("Ready");
  let channel = $state<ChannelViewModel>({
    id: "trail",
    name: "trail",
    topic: "Local Svelte conversation",
    messages: [
      ...Array.from({ length: 12 }, (_, index) => entry(`note-${index}`, `Trail note ${index + 1}`)),
      {
        ...entry("starter", "Open the thread, send a message or try /echo."),
        thread: { id: "thread", name: "Route planning", messageCount: 0 },
      },
    ],
    threads: [
      {
        id: "thread",
        name: "Route planning",
        parentMessageId: "starter",
        messages: [],
      },
    ],
  });

  function send(content: string): void {
    channel = {
      ...channel,
      messages: [
        ...channel.messages,
        entry(`new-${channel.messages.length}`, content),
      ],
    };
  }
  function sendReply(threadId: string, content: string): void {
    const threads = channel.threads?.map(thread => thread.id === threadId
      ? {
        ...thread,
        messages: [
          ...thread.messages,
          entry(`reply-${thread.messages.length}`, content),
        ],
      }
      : thread) ?? [];
    const thread = threads.find(thread => thread.id === threadId);
    if (!thread)
      return;
    channel = {
      ...channel,
      threads,
      messages: channel.messages.map(message => message.thread?.id === threadId
        ? {
          ...message,
          thread: {
            ...message.thread,
            messageCount: thread.messages.length,
            lastMessage: { author, content, timestamp },
          },
        }
        : message),
    };
  }
  function command({ command, arguments: args }: SlashCommandInvocation): void {
    status = `Command: ${command.name} / ${args.text ?? ""} / ${args.priority ?? "normal"}`;
  }
</script>

<DiscordUI theme="dark" referenceTime={timestamp}>
  <ChannelView {channel} height={460} {commands} {activeThreadId}
               onThreadOpen={id => activeThreadId = id} onThreadClose={() => activeThreadId = null}
               onSend={send} onThreadSend={sendReply} onSlashCommand={command} />
</DiscordUI>
<p role="status">{status}</p>
