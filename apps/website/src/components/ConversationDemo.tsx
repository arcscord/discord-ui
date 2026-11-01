import type { MessageView, ThemeName, ThreadMessageView } from "@arcscord/discord-ui";
import { ChannelView, DiscordUI } from "@arcscord/discord-ui";
import { useState } from "react";
import { initialChannel } from "../data/examples";

function localMessage(content: string): ThreadMessageView {
  return {
    id: crypto.randomUUID(),
    author: {
      id: "you",
      displayName: "You",
      color: "#e4a44b",
      avatarFallback: { background: "#98601d", letter: "Y" },
    },
    timestamp: new Date().toISOString(),
    body: { kind: "text", content },
  };
}

export function ConversationDemo({ theme = "dark" }: { theme?: ThemeName }) {
  const [channel, setChannel] = useState(initialChannel);
  function toggleReaction(messageId: string, reactionId: string) {
    function update<T extends MessageView>(message: T): T {
      return message.id === messageId
        ? { ...message, reactions: message.reactions?.map(reaction => reaction.id === reactionId
            ? { ...reaction, me: !reaction.me, count: reaction.count + (reaction.me
                ? -1
                : 1) }
            : reaction) ?? [] }
        : message;
    }
    setChannel(current => ({
      ...current,
      messages: current.messages.map(update),
      threads: current.threads?.map(thread => ({
        ...thread,
        messages: thread.messages.map(update),
      })) ?? [],
    }));
  }
  function send(content: string) {
    const message = localMessage(content);
    setChannel(current => ({
      ...current,
      messages: [...current.messages, message],
    }));
  }
  function reply(threadId: string, content: string) {
    const message = localMessage(content);
    setChannel(current => ({
      ...current,
      threads: current.threads?.map(thread => thread.id === threadId
        ? {
            ...thread,
            messages: [...thread.messages, message],
          }
        : thread),
      messages: current.messages.map(item => item.thread?.id === threadId
        ? {
            ...item,
            thread: {
              ...item.thread,
              messageCount: item.thread.messageCount + 1,
              lastMessage: { author: message.author, timestamp: message.timestamp, content },
            },
          }
        : item),
    }));
  }
  return <DiscordUI theme={theme} locale="en-US" timeZone="UTC" className="conversation-frame"><ChannelView channel={channel} height={540} showDateSeparators={false} onSend={send} onThreadSend={reply} onReactionToggle={toggleReaction} /></DiscordUI>;
}
