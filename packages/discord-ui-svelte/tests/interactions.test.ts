import type { ComponentProps } from "svelte";
import type { MessageInteractionHandlers, MessageProps, MessageView } from "../src/index.js";
import { render } from "svelte/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import { Author, Avatar, Markdown, Mention, Message, ThreadPreview } from "../src/index.js";

const author = { id: "author", displayName: "Author" };
const message = {
  id: "message",
  author,
  timestamp: "2026-11-21T09:00:00Z",
  body: { kind: "markdown", content: "<@123456789012345678> <#456789012345678901> <@&789012345678901234> </test:123456789012345678> @everyone" },
} satisfies MessageView;
const click = () => undefined;

describe("utility interactions", () => {
  it("preserves static author and avatar targets without handlers", () => {
    expect(render(Author, {
      props: { author },
    }).body).not.toContain("<button");
    const avatar = render(Avatar, {
      props: { author },
    }).body;
    expect(avatar).not.toContain("<button");
    expect(avatar).toContain("aria-hidden=\"true\"");
  });

  it("uses native buttons for click and context callbacks", () => {
    expect(render(Author, {
      props: { author, onUserClick: click },
    }).body).toContain("<button type=\"button\"");
    const avatar = render(Avatar, {
      props: { author, onUserClick: click },
    }).body;
    expect(avatar).toContain("aria-label=\"Author\"");
    expect(avatar).not.toMatch(/<button[^>]*aria-hidden/u);
    const avatarContext = render(Avatar, {
      props: { author, onUserContextMenu: click },
    }).body;
    expect(avatarContext).toContain("<button");
    expect(avatarContext).not.toContain("role=\"img\"");
    expect(avatarContext).toContain("aria-haspopup=\"menu\"");
    expect(avatarContext).toContain("aria-label=\"Author\"");
    const context = render(Author, {
      props: { author, onUserContextMenu: click },
    }).body;
    expect(context).toContain("<button");
    expect(context).toContain("aria-haspopup=\"menu\"");
    expect(render(Mention, {
      props: { id: "123", name: "User", onMentionContextMenu: click },
    }).body).toContain("<button");
  });

  it("requires an identified mention and inherits callbacks through message Markdown", () => {
    expect(render(Mention, {
      props: { name: "everyone", onMentionClick: click },
    }).body).not.toContain("<button");
    expect(render(Mention, {
      props: { id: "123456789012345678", name: "User", onMentionClick: click },
    }).body).toContain("<button");
    const body = render(Message, {
      props: { message, onMentionClick: click, onMessageContextMenu: click },
    }).body;
    expect(body.match(/<button/gu)).toHaveLength(4);
    expect(body).toMatch(/<article[^>]*tabindex="0"/u);
  });

  it("keeps mentions inside links static and spoiler mentions interactive", () => {
    const linked = render(Markdown, {
      props: { content: "[<@123456789012345678>](https://example.com)", onMentionClick: click },
    }).body;
    expect(linked).toContain("<a ");
    expect(linked).not.toContain("<button");
    const spoiler = render(Markdown, {
      props: { content: "||<@123456789012345678>||", onMentionClick: click },
    }).body;
    expect(spoiler.match(/<button/gu)).toHaveLength(2);
  });

  it("exposes native events in public callback props", () => {
    expectTypeOf<ComponentProps<typeof Message>>().toEqualTypeOf<MessageProps>();
    expectTypeOf<Parameters<NonNullable<MessageInteractionHandlers["onUserClick"]>>[1]>().toEqualTypeOf<MouseEvent>();
  });
});

it("removes duplicate avatar tab stops while retaining standalone avatar access", () => {
  const body = render(Message, {
    props: { message, onUserClick: click },
  }).body;
  expect(body).toMatch(/<button(?=[^>]*class="dui-avatar dui-utility-target")(?=[^>]*tabindex="-1")/u);
  const standalone = render(Avatar, {
    props: { author, onUserClick: click },
  }).body;
  expect(standalone).not.toContain("tabindex=\"-1\"");
});

it("separates thread navigation and recent-author actions", () => {
  const body = render(ThreadPreview, {
    props: {
      thread: {
        id: "thread",
        name: "Discussion",
        messageCount: 2,
        lastMessage: { author, content: "Recent", timestamp: message.timestamp },
      },
      onOpen: click,
      onUserClick: click,
    },
  }).body;
  expect(body).toContain("<div class=\"dui-thread-preview\"");
  expect(body).toContain("class=\"dui-thread-open\"");
  expect(body).toContain("class=\"dui-author-name dui-utility-target\"");
  expect(body).not.toMatch(/<button[^>]*class="dui-thread-preview"/u);
});
