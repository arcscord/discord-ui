import type { MentionTarget } from "../src/index";
import { expect, it, vi } from "vitest";
import { createRenderer, h, nextTick, shallowRef } from "vue";
import { Author, Mention, Message } from "../src/index";

type HostNode = { tag: string; props: Record<string, unknown>; children: HostNode[] };
const node = (tag: string): HostNode => ({ tag, props: {}, children: [] });
const renderer = createRenderer<HostNode, HostNode>({
  createElement: node,
  createText: () => node("text"),
  createComment: () => node("comment"),
  setText: () => {},
  setElementText: () => {},
  parentNode: () => null,
  nextSibling: () => null,
  insert: (child, parent) => { parent.children.push(child); },
  remove: () => {},
  patchProp: (element, key, _previous, value) => { element.props[key] = value; },
});
function find(parent: HostNode, className: string): HostNode | undefined {
  if (String(parent.props.class).split(" ").includes(className))
    return parent;
  for (const child of parent.children) {
    const match = find(child, className);
    if (match)
      return match;
  }
  return undefined;
}

it("updates standalone utility semantics when only listener props change", async () => {
  const handler = shallowRef<((target: MentionTarget, event: MouseEvent) => void) | undefined>(() => {});
  const root = node("root");
  const app = renderer.createApp({
    render: () => h(Mention, { id: "123", name: "Name", onMentionContextMenu: handler.value }),
  });
  app.mount(root);
  expect(find(root, "dui-mention")?.props.tabindex).toBe(0);
  handler.value = undefined;
  await nextTick();
  expect(find(root, "dui-mention")?.props.tabindex).toBeUndefined();
  expect(find(root, "dui-mention")?.props.onContextmenu).toBeUndefined();
  const replacement = vi.fn();
  handler.value = replacement;
  await nextTick();
  const stopPropagation = vi.fn();
  (find(root, "dui-mention")?.props.onContextmenu as (event: unknown) => void)({ stopPropagation });
  expect(stopPropagation).toHaveBeenCalledOnce();
  expect(replacement).toHaveBeenCalledOnce();
  app.unmount();
});

it("reacts to author listener removal and preserves once-only emission", async () => {
  const once = vi.fn();
  const author = { id: "author", displayName: "Author" };
  const active = shallowRef(true);
  const root = node("root");
  const app = renderer.createApp({
    render: () => h(Author, {
      author,
      onUserClickOnce: active.value ? once : undefined,
    }),
  });
  app.mount(root);
  const name = find(root, "dui-author-name")!;
  expect(name.tag).toBe("button");
  (name.props.onClick as (event: unknown) => void)({});
  (name.props.onClick as (event: unknown) => void)({});
  expect(once).toHaveBeenCalledOnce();
  active.value = false;
  await nextTick();
  // The host records replacement elements by appending them.
  expect(root.children[0]?.children.at(-1)?.tag).toBe("span");
  app.unmount();
});

it("removes inherited mention handlers without changing message data", async () => {
  const handler = shallowRef<((target: MentionTarget, event: MouseEvent) => void) | undefined>(() => {});
  const message = {
    id: "message",
    author: { id: "author", displayName: "Author" },
    timestamp: "2026-11-21T09:00:00Z",
    body: { kind: "markdown" as const, content: "<@123000000000000000>" },
  };
  const root = node("root");
  const app = renderer.createApp({
    render: () => h(Message, { message, onMentionContextMenu: handler.value }),
  });
  app.mount(root);
  expect(find(root, "dui-mention")?.props.tabindex).toBe(0);
  handler.value = undefined;
  await nextTick();
  expect(find(root, "dui-mention")?.props.onContextmenu).toBeUndefined();
  app.unmount();
});
