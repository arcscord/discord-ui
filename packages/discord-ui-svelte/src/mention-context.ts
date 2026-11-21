import type { MentionInteractionHandlers } from "./interactions.js";
import { getContext, setContext } from "svelte";

const mentionInteractions = Symbol("discord-ui-mention-interactions");

export function provideMentionInteractions(value: () => MentionInteractionHandlers): void {
  setContext(mentionInteractions, value);
}

export function getMentionInteractions(): () => MentionInteractionHandlers {
  return getContext<(() => MentionInteractionHandlers) | undefined>(mentionInteractions) ?? (() => ({}));
}
