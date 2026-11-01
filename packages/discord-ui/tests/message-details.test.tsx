import type { MessageView } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, expectTypeOf, it } from "vitest";
import { DiscordUI, Message } from "../src/index";

const base: MessageView = {
  id: "reply",
  author: { id: "bob", displayName: "Bob" },
  timestamp: "2026-10-29T18:00:00Z",
  body: { kind: "markdown", content: "Here it is." },
};

it("renders an escaped reply snapshot before the author without nesting a message", () => {
  const html = renderToStaticMarkup(
    <Message message={{
      ...base,
      reply: {
        messageId: "original",
        author: { id: "alice", displayName: "<Alice>", avatarUrl: "https://example.com/avatar.png" },
        content: "<script>alert(1)</script> **literal**",
      },
    }}
    />,
  );
  expect(html).toContain("&lt;Alice&gt;");
  expect(html).toContain("&lt;script&gt;alert(1)&lt;/script&gt; **literal**");
  expect(html).not.toContain("<script>");
  expect(html.match(/<article/g)).toHaveLength(1);
  expect(html.indexOf("dui-reply-preview")).toBeLessThan(html.indexOf("dui-message-header"));
});

it("renders unavailable originals and custom labels without leaking stale content", () => {
  const html = renderToStaticMarkup(
    <DiscordUI labels={{ reply: "Réponse à", replyUnavailable: "Message indisponible" }}>
      <Message message={{
        ...base,
        reply: { messageId: "deleted", unavailable: true },
      }}
      />
    </DiscordUI>,
  );
  expect(html).toContain("aria-label=\"Réponse à\"");
  expect(html).toContain("Message indisponible");
  expect(html).not.toContain("dui-reply-preview\"><span class=\"dui-avatar");
});

it("blocks remote avatars in reply previews", () => {
  const html = renderToStaticMarkup(
    <DiscordUI allowRemoteMedia={false}>
      <Message message={{
        ...base,
        reply: {
          messageId: "original",
          author: { id: "alice", displayName: "Alice", avatarUrl: "https://example.com/avatar.png" },
          content: "Hello",
        },
      }}
      />
    </DiscordUI>,
  );
  expect(html).not.toContain("https://example.com/avatar.png");
});

it("renders a localized edit tooltip with a deterministic timezone and supports unknown edit dates", () => {
  const html = renderToStaticMarkup(<DiscordUI timeZone="Europe/Zurich" labels={{ edited: "(modifié)" }}><Message message={{ ...base, editedTimestamp: "2026-10-29T18:04:00Z" }} /></DiscordUI>);
  expect(html).toContain("dateTime=\"2026-10-29T18:04:00.000Z\"");
  expect(html).toContain("7:04 PM");
  expect(html).toContain("(modifié)");
  const unknownDate = renderToStaticMarkup(<Message message={{ ...base, edited: true }} />);
  expect(unknownDate).toContain("(edited)");
  const invalidDate = renderToStaticMarkup(<Message message={{ ...base, editedTimestamp: "invalid" }} />);
  expect(invalidDate).toContain("title=\"Invalid timestamp\">(edited)");
  expect(renderToStaticMarkup(<Message message={base} />)).not.toContain("dui-message-edited");
});

it("renders classic attachments with safe links and leaves spoiler files unmounted", () => {
  const html = renderToStaticMarkup(
    <DiscordUI labels={{ downloadFile: "Télécharger {name}" }}>
      <Message message={{
        ...base,
        attachments: [
          {
            id: "safe",
            kind: "file",
            name: "guide.pdf",
            url: "https://example.com/guide.pdf",
            size: "24 KB",
          },
          {
            id: "unsafe",
            kind: "file",
            name: "unsafe.txt",
            url: "javascript:alert(1)",
          },
          {
            id: "spoiler",
            kind: "file",
            name: "secret.txt",
            url: "https://example.com/secret.txt",
            spoiler: true,
          },
        ],
      }}
      />
    </DiscordUI>,
  );
  expect(html).toContain("href=\"https://example.com/guide.pdf\"");
  expect(html).toContain("24 KB");
  expect(html).toContain("aria-label=\"Télécharger guide.pdf\"");
  expect(html).toContain("unsafe.txt");
  expect(html).not.toContain("javascript:");
  expect(html).not.toContain("secret.txt");
});

it("excludes classic attachments from V2 messages", () => {
  expectTypeOf<Extract<MessageView, { body: { kind: "components-v2" } }>["attachments"]>().toEqualTypeOf<undefined>();
});
