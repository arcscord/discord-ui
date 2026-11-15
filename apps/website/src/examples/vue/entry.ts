import type { App, Component } from "vue";
import { createApp } from "vue";
import Conversation from "./conversation.vue";
import FirstMessage from "./first-message.vue";
import Interactions from "./interactions.vue";
import MediaPolicy from "./media-policy.vue";
import SlotsAndContent from "./slots-and-content.vue";
import ThemesAndLocalization from "./themes-and-localization.vue";

const examples: Record<string, Component> = {
  "first-message": FirstMessage,
  "interactions": Interactions,
  "conversation": Conversation,
  "slots-and-content": SlotsAndContent,
  "media-policy": MediaPolicy,
  "themes-and-localization": ThemesAndLocalization,
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
