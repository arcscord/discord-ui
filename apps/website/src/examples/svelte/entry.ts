import type { Component } from "svelte";
import { mount, unmount } from "svelte";
import Conversation from "./conversation.svelte";
import Interactions from "./interactions.svelte";
import Message from "./message.svelte";
import ThemesAndMedia from "./themes-and-media.svelte";

const examples = new Map<string, Component>([
  ["message", Message],
  ["interactions", Interactions],
  ["conversation", Conversation],
  ["themes-and-media", ThemesAndMedia],
]);

export function mountExample(id: string, target: HTMLElement): () => void {
  const component = examples.get(id);
  if (!component)
    throw new Error(`Unknown Svelte example: ${id}`);
  const instance = mount(component, { target });
  return () => {
    void unmount(instance);
  };
}
