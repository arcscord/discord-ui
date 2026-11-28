import type { MentionTarget } from "../src/index";
import { defaultDisplayOptions, themes } from "@arcscord/discord-ui-core";
import { expect, it, vi } from "vitest";
import { createRenderer, h, nextTick, shallowRef } from "vue";
import { displayKey } from "../src/display-context";
import { Author, ChannelList, ChannelView, Mention, Message, ThreadPanel } from "../src/index";

type HostNode = { tag: string; props: Record<string, unknown>; children: HostNode[]; parent?: HostNode | undefined; focus: () => void };
function node(tag: string): HostNode {
  return {
    tag,
    props: {},
    children: [],
    focus: () => {},
  };
}
const renderer = createRenderer<HostNode, HostNode>({
  createElement: node,
  createText: () => node("text"),
  createComment: () => node("comment"),
  setText: () => {},
  setElementText: () => {},
  parentNode: child => child.parent ?? null,
  nextSibling: () => null,
  insert: (child, parent) => {
    child.parent = parent;
    parent.children.push(child);
  },
  remove: (child) => {
    if (child.parent)
      child.parent.children.splice(child.parent.children.indexOf(child), 1);
  },
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
  app.provide(displayKey, { ...defaultDisplayOptions, scoped: true, resolvedTheme: themes.dark });
  app.mount(root);
  expect(find(root, "dui-mention")?.tag).toBe("button");
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
  app.provide(displayKey, { ...defaultDisplayOptions, scoped: true, resolvedTheme: themes.dark });
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
  app.provide(displayKey, { ...defaultDisplayOptions, scoped: true, resolvedTheme: themes.dark });
  app.mount(root);
  expect(find(root, "dui-mention")?.tag).toBe("button");
  handler.value = undefined;
  await nextTick();
  expect(find(root, "dui-mention")?.props.onContextmenu).toBeUndefined();
  app.unmount();
});

it("removes standalone once-only controls after consumption", async () => {
  const root = node("root");
  const once = vi.fn();
  const app = renderer.createApp({
    render: () => h(Mention, { id: "123", name: "Name", onMentionClickOnce: once }),
  });
  app.provide(displayKey, { ...defaultDisplayOptions, scoped: true, resolvedTheme: themes.dark });
  app.mount(root);
  (find(root, "dui-mention")!.props.onClick as (event: unknown) => void)({});
  await nextTick();
  expect(once).toHaveBeenCalledOnce();
  expect(root.children.at(-1)?.tag).toBe("span");
  app.unmount();
});

it.each([
  ["channel", false],
  ["channel", true],
  ["thread", false],
  ["thread", true],
] as const)("consumes utility once only once through the %s public wrapper with regular=%s", async (kind, hasRegular) => {
  const root = node("root");
  const once = vi.fn();
  const regular = vi.fn();
  const message = {
    id: "message",
    author: { id: "author", displayName: "Author" },
    timestamp: "2026-11-21T09:00:00Z",
    body: { kind: "text" as const, content: "Message" },
  };
  const app = renderer.createApp({
    render: () => kind === "channel"
      ? h(ChannelView, {
          channel: {
            id: "channel",
            name: "channel",
            messages: [message],
          },
          composer: false,
          onUserClickOnce: once,
          onUserClick: hasRegular ? regular : undefined,
        })
      : h(ThreadPanel, {
          thread: {
            id: "thread",
            name: "Thread",
            parentMessageId: "parent",
            messages: [message],
          },
          onUserClickOnce: once,
          onUserClick: hasRegular ? regular : undefined,
        }),
  });
  app.provide(displayKey, { ...defaultDisplayOptions, scoped: true, resolvedTheme: themes.dark });
  app.mount(root);
  const click = find(root, "dui-author-name")!.props.onClick as (event: unknown) => void;
  click({});
  await nextTick();
  if (hasRegular)
    click({});
  else
    expect(find(root, "dui-author-name")!.tag).toBe("span");
  expect(once).toHaveBeenCalledOnce();
  expect(regular).toHaveBeenCalledTimes(hasRegular ? 2 : 0);
  app.unmount();
});

it("updates channel navigation when listeners are added and removed", async () => {
  const handler = shallowRef<((id: string) => void) | undefined>();
  const root = node("root");
  const categories = [
    {
      id: "category",
      channels: [
        { id: "general", name: "general" },
      ],
    },
  ];
  const app = renderer.createApp({
    render: () => h(ChannelList, { categories, onChannelClick: handler.value }),
  });
  app.mount(root);
  expect(find(root, "dui-channel-list-item")?.tag).toBe("span");
  const click = vi.fn();
  handler.value = click;
  await nextTick();
  const button = find(root, "dui-channel-list-item")!;
  expect(button.tag).toBe("button");
  (button.props.onClick as () => void)();
  expect(click).toHaveBeenCalledWith("general");
  handler.value = undefined;
  await nextTick();
  expect(find(root, "dui-channel-list-item")?.tag).toBe("span");
  app.unmount();
});

it("consumes once-only channel navigation listeners", async () => {
  const once = vi.fn();
  const root = node("root");
  const app = renderer.createApp({
    render: () => h(ChannelList, {
      categories: [
        {
          id: "category",
          channels: [
            { id: "general", name: "general" },
          ],
        },
      ],
      onChannelClickOnce: once,
    }),
  });
  app.mount(root);
  const button = find(root, "dui-channel-list-item")!;
  (button.props.onClick as () => void)();
  (button.props.onClick as () => void)();
  expect(once).toHaveBeenCalledOnce();
  await nextTick();
  expect(find(root, "dui-channel-list-item")?.tag).toBe("span");
  app.unmount();
});
