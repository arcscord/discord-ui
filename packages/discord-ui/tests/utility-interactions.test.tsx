import type { MouseEvent } from "react";
import type { MessageInteractionHandlers, MessageView } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import { Author, Avatar, ChannelView, Markdown, Mention, Message, ThreadPanel } from "../src/index";

const author = { id: "author", displayName: "Author" };
const message = {
  id: "message",
  author,
  timestamp: "2026-11-21T09:00:00Z",
  body: { kind: "markdown", content: "<@123456789012345678> <#456789012345678901> <@&789012345678901234> </test:123456789012345678> @everyone" },
} satisfies MessageView;
const handler = () => undefined;

describe("utility interactions", () => {
  it("preserves static output when no handlers are supplied", () => {
    expect(renderToStaticMarkup(<Author author={author} />)).not.toContain("<button");
    expect(renderToStaticMarkup(<Avatar author={author} />)).toContain("aria-hidden=\"true\"");
    expect(renderToStaticMarkup(<Message message={message} />)).not.toContain("tabindex");
  });

  it("uses named buttons for both click and context-only actions", () => {
    expect(renderToStaticMarkup(<Author author={author} onUserClick={handler} />)).toContain("<button type=\"button\"");
    const avatar = renderToStaticMarkup(<Avatar author={author} onUserClick={handler} />);
    expect(avatar).toContain("aria-label=\"Author\"");
    expect(avatar).not.toContain("aria-hidden");
    const contextual = renderToStaticMarkup(<Author author={author} onUserContextMenu={handler} />);
    expect(contextual).toContain("<button");
    expect(contextual).toContain("aria-haspopup=\"menu\"");
  });

  it("requires a mention ID and supports all four mention kinds", () => {
    expect(renderToStaticMarkup(<Mention name="everyone" onMentionClick={handler} />)).not.toContain("<button");
    const html = renderToStaticMarkup(<Message message={message} onMentionClick={handler} onMessageContextMenu={handler} />);
    expect(html.match(/<button/gu)).toHaveLength(4);
    expect(html).toMatch(/<article[^>]*tabindex="0"/u);
  });

  it("inherits mention handlers in embeds and Components V2", () => {
    const embed = {
      ...message,
      embeds: [
        {
          id: "embed",
          description: "<@123456789012345678>",
          fields: [
            { id: "field", name: "Field", value: "<#456789012345678901>" },
          ],
        },
      ],
    };
    expect(renderToStaticMarkup(<Message message={embed} onMentionClick={handler} />).match(/<button/gu)).toHaveLength(6);
    const v2: MessageView = {
      id: message.id,
      author,
      timestamp: message.timestamp,
      body: {
        kind: "components-v2",
        components: [
          { id: "text", kind: "text-display", content: "<@123456789012345678>" },
        ],
      },
    };
    expect(renderToStaticMarkup(<Message message={v2} onMentionClick={handler} />).match(/<button/gu)).toHaveLength(1);
  });

  it("forwards user handlers to replies, channels and thread messages", () => {
    const reply: MessageView = {
      ...message,
      reply: { messageId: "original", author, content: "Reply" },
    };
    expect(renderToStaticMarkup(<Message message={reply} onUserClick={handler} />).match(/<button/gu)).toHaveLength(4);
    expect(renderToStaticMarkup(
      <ChannelView
        channel={{
          id: "channel",
          name: "general",
          messages: [message],
        }}
        composer={false}
        onUserClick={handler}
      />,
    ).match(/<button/gu)).toHaveLength(2);
    const thread = {
      id: "thread",
      name: "Thread",
      parentMessageId: message.id,
      messages: [message],
    };
    expect(renderToStaticMarkup(<ThreadPanel thread={thread} parentMessage={message} onUserClick={handler} />).match(/dui-avatar dui-utility-target/gu)).toHaveLength(2);
  });

  it("keeps linked mentions static and spoiler content independently interactive", () => {
    const linked = renderToStaticMarkup(<Markdown content="[**<@123456789012345678>**](https://example.com)" onMentionClick={handler} />);
    expect(linked).toContain("<a ");
    expect(linked).not.toContain("<button");
    const spoiler = renderToStaticMarkup(<Markdown content="||<@123456789012345678>||" onMentionClick={handler} />);
    expect(spoiler.match(/<button/gu)).toHaveLength(2);
  });

  it("keeps composed avatars out of the duplicate tab sequence", () => {
    const html = renderToStaticMarkup(<Message message={message} onUserClick={handler} />);
    expect(html).toMatch(/<button[^>]*class="dui-avatar dui-utility-target"[^>]*tabindex="-1"/u);
  });

  it("passes user actions to thread preview authors without nested buttons", () => {
    const html = renderToStaticMarkup(
      <Message
        message={{
          ...message,
          thread: {
            id: "thread",
            name: "Thread",
            messageCount: 1,
            lastMessage: { author, content: "Latest reply", timestamp: message.timestamp },
          },
        }}
        onUserClick={handler}
        onThreadOpen={handler}
      />,
    );
    expect(html).toContain("dui-thread-open");
    expect(html).toMatch(/dui-thread-last-author[\s\S]*?dui-author-name dui-utility-target/u);
  });

  it("specializes public callbacks with React events", () => {
    expectTypeOf<Parameters<NonNullable<MessageInteractionHandlers["onUserClick"]>>[1]>().toEqualTypeOf<MouseEvent<HTMLElement>>();
  });
});
