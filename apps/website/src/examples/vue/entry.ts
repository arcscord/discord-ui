import type { App, Component } from "vue";
import { createApp } from "vue";
import Conversation from "./conversation.vue";
import FirstMessage from "./first-message.vue";
import Interactions from "./interactions.vue";
import SlotsAndContent from "./slots-and-content.vue";

const examples: Record<string, Component> = {
  "first-message": FirstMessage,
  "interactions": Interactions,
  "conversation": Conversation,
  "slots-and-content": SlotsAndContent,
};
export function mount(id: string, element: HTMLElement, prefix: string): () => void {
  const component = examples[id];
  if (!component)
    throw new Error(`Unknown Vue example: ${id}`);
  const app: App = createApp(component);
  app.config.idPrefix = prefix;
  app.mount(element);
  return () => app.unmount();
}
