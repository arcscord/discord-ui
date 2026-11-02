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

it("shows the localized edited marker only when edited is true, without an edit timestamp", () => {
  const html = renderToStaticMarkup(<DiscordUI labels={{ edited: "(modifié)" }}><Message message={{ ...base, edited: true }} /></DiscordUI>);
  expect(html).toContain("<span class=\"dui-message-edited\">(modifié)</span>");
  expect(html.match(/<time /g)).toHaveLength(1);
  expect(renderToStaticMarkup(<Message message={{ ...base, edited: true }} />)).toContain("(edited)");
  expect(renderToStaticMarkup(<Message message={{ ...base, edited: false }} />)).not.toContain("dui-message-edited");
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

it("renders interaction context safely, with custom labels and blocked remote avatars", () => {
  const message = {
    ...base,
    reply: {
      kind: "interaction",
      author: { id: "alice", displayName: "<Alice>", avatarUrl: "https://example.com/private.png" },
      commandName: "settings <script>",
    },
    ephemeral: true,
  } satisfies MessageView;
  expect(JSON.parse(JSON.stringify(message))).toEqual(message);
  const html = renderToStaticMarkup(
    <DiscordUI
      allowRemoteMedia={false}
      labels={{
        interactionReply: "Réponse à une interaction",
        interactionUsed: "a utilisé",
        ephemeralNotice: "Vous seul pouvez voir ceci",
        dismissMessage: "Fermer le message",
      }}
    >
      <Message message={message} onEphemeralDismiss={() => {}} />
    </DiscordUI>,
  );
  expect(html).toContain("aria-label=\"Réponse à une interaction\"");
  expect(html).toContain("&lt;Alice&gt;");
  expect(html).toContain("a utilisé");
  expect(html).toContain("/settings &lt;script&gt;");
  expect(html).not.toContain("https://example.com/private.png");
  expect(html).not.toContain("<script>");
  expect(html).toContain("Vous seul pouvez voir ceci");
  expect(html).toContain("Fermer le message");
  expect(html.indexOf("dui-ephemeral-notice")).toBeGreaterThan(html.indexOf("Here it is."));
});

it("shows ephemeral notices for classic and V2 messages, with no inactive dismissal control", () => {
  const messages = [
    { ...base, ephemeral: true },
    {
      id: "private-v2",
      author: base.author,
      timestamp: base.timestamp,
      ephemeral: true,
      body: {
        kind: "components-v2",
        components: [
          { id: "private", kind: "text-display", content: "Private response" },
        ],
      },
    },
  ] satisfies MessageView[];
  for (const message of messages) {
    const html = renderToStaticMarkup(<Message message={message} />);
    expect(html).toContain("data-ephemeral=\"true\"");
    expect(html).toContain("Only you can see this");
    expect(html).not.toContain("Dismiss message");
  }
  const publicMessage = renderToStaticMarkup(<Message message={base} onEphemeralDismiss={() => {}} />);
  expect(publicMessage).not.toContain("dui-ephemeral-notice");
  expect(publicMessage).not.toContain("data-ephemeral");
});
