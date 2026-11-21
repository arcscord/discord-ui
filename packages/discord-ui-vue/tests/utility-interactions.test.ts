import type { MessageAuthor, MessageView } from "@arcscord/discord-ui-core";
import type { ChannelViewEmits, MentionTarget, MessageEmits, MessageProps, UserInteractionHandlers } from "../src/index";
import { renderToString } from "@vue/server-renderer";
import { expect, expectTypeOf, it } from "vitest";
import { createSSRApp, h } from "vue";
import { Author, Avatar, Markdown, Mention, Message } from "../src/index";

const author: MessageAuthor = { id: "author", displayName: "Author" };
const message: MessageView = {
  id: "message",
  author,
  timestamp: "2026-11-21T09:00:00Z",
  body: { kind: "markdown", content: "<@123000000000000000> <#234000000000000000> <@&345000000000000000> </test:456000000000000000> @everyone @here" },
};
function noop() {}

it("exports native optional utility callback and event contracts", () => {
  expectTypeOf<MessageProps["onUserClick"]>().toEqualTypeOf<((author: MessageAuthor, event: MouseEvent) => void) | undefined>();
  expectTypeOf<UserInteractionHandlers["onUserClick"]>().toEqualTypeOf<MessageProps["onUserClick"]>();
  expectTypeOf<MessageEmits["mention-click"]>().toEqualTypeOf<[mention: MentionTarget, event: MouseEvent]>();
  expectTypeOf<ChannelViewEmits["message-context-menu"]>().toEqualTypeOf<[message: MessageView, event: MouseEvent]>();
});

it("renders semantic author controls only for enabled handlers", async () => {
  const render = (component: typeof Author | typeof Avatar, handlers = {}) => renderToString(createSSRApp({
    render: () => h(component, { author, ...handlers }),
  }));
  expect(await render(Author)).not.toContain("<button");
  expect(await render(Avatar)).not.toContain("<button");
  expect(await render(Author, { onUserClick: noop })).toContain("<button class=\"dui-author-name dui-utility-target\" type=\"button\"");
  const avatar = await render(Avatar, { onUserClick: noop });
  expect(avatar).toContain("aria-label=\"Author\"");
  expect(avatar).toContain("<button class=\"dui-avatar dui-utility-target\"");
  expect(avatar.match(/class="dui-avatar/gu)).toHaveLength(1);
  expect(await render(Author, { onUserContextMenu: noop })).toContain("tabindex=\"0\"");
});

it("inherits identified Markdown mentions and leaves broadcasts static", async () => {
  const html = await renderToString(createSSRApp({
    render: () => h(Message, { message, onMentionClick: noop, onMessageContextMenu: noop }),
  }));
  expect(html.match(/<button class="dui-mention dui-utility-target"/gu)).toHaveLength(4);
  expect(html).toContain("<span class=\"dui-mention\" style=\"\">@everyone</span>");
  expect(html).toContain("<span class=\"dui-mention\" style=\"\">@here</span>");
  expect(html).toMatch(/<article[^>]*tabindex="0"/u);
});

it("keeps unidentified mentions static and linked mentions free of nested buttons", async () => {
  const html = await renderToString(createSSRApp({
    render: () => h(Mention, { name: "name", onMentionClick: noop }),
  }));
  expect(html).not.toContain("<button");
  const linked = await renderToString(createSSRApp({
    render: () => h(Markdown, { content: "[<@123000000000000000>](https://example.com) ||<@456000000000000000>||", onMentionClick: noop }),
  }));
  expect(linked).not.toMatch(/<a[^>]*>[\s\S]*?<button[\s\S]*?<\/a>/u);
  expect(linked).toContain("class=\"dui-mention dui-utility-target\"");
});
