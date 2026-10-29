import type { MessageView } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { renderHighlightedCode } from "../src/highlight";
import { DiscordUI, Markdown, MediaGallery, Message } from "../src/index";
import { linkUrl, mediaUrl } from "../src/utils/urls";

it("renders Discord entities, formatting, lists and fenced code without injected HTML", () => {
  const html = renderToStaticMarkup(
    <DiscordUI entities={{
      users: {
        "123456789012345678": { name: "Alice" },
      },
      emojis: {
        "456789012345678901": { name: "arc", image: "/emoji.svg" },
      },
    }}
    >
      <Markdown content={"# Title\n**bold** <@123456789012345678> <:arc:456789012345678901>\n- one\n- two\n```html\n<img src=x onerror=alert(1)>\n```"} />
    </DiscordUI>,
  );
  expect(html).toContain("<strong>bold</strong>");
  expect(html).toContain("@Alice");
  expect(html).toContain("alt=\":arc:\"");
  expect(html).toContain("<li>one</li>");
  expect(html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  expect(html).not.toContain("<img src=x");
});

it("does not expose spoilers before reveal or activate unsafe links", () => {
  const html = renderToStaticMarkup(<Markdown content="||private text|| [unsafe](javascript:alert(1))" />);
  expect(html).not.toContain("private text");
  expect(html).toContain("aria-expanded=\"false\"");
  expect(html).not.toContain("href=\"javascript:");
});

it("uses the message clock for relative timestamps and supports explicit overrides", () => {
  const message: MessageView = {
    id: "1",
    author: { id: "1", displayName: "Clock" },
    timestamp: "2026-10-29T18:00:00Z",
    body: { kind: "markdown", content: "<t:1793297100:R>" },
  };
  const html = renderToStaticMarkup(<Message message={message} />);
  expect(html).toContain("in 5 minutes");
  const overridden = renderToStaticMarkup(<DiscordUI referenceTime="2026-10-29T18:10:00Z"><Message message={message} /></DiscordUI>);
  expect(overridden).toContain("5 minutes ago");
});

it("blocks remote media consistently in avatars, emojis, galleries and embeds", () => {
  const message: MessageView = {
    id: "1",
    author: { id: "1", displayName: "Remote", avatarUrl: "https://example.com/avatar.png" },
    timestamp: "2026-10-29T18:00:00Z",
    body: { kind: "markdown", content: "<:arc:456789012345678901>" },
    media: [
      { id: "img", url: "https://example.com/image.png", alt: "remote" },
    ],
    embeds: [
      {
        id: "embed",
        author: { name: "Remote", iconUrl: "https://example.com/author.png" },
        footer: { text: "Remote", iconUrl: "https://example.com/footer.png" },
        image: { id: "embed-image", url: "https://example.com/embed.png", alt: "remote embed" },
      },
    ],
  };
  const html = renderToStaticMarkup(
    <DiscordUI
      allowRemoteMedia={false}
      entities={{
        emojis: {
          "456789012345678901": { name: "arc", image: "https://example.com/emoji.png" },
        },
      }}
    >
      <Message message={message} />
    </DiscordUI>,
  );
  expect(html).not.toContain("https://example.com");
  expect(html).not.toContain("<img");
  expect(html).toContain("Media unavailable");
  expect(html).toContain(":arc:");
});

it("leaves spoiled media unmounted until reveal, preserving alt text on regular media", () => {
  const html = renderToStaticMarkup(
    <MediaGallery items={[
      { id: "1", url: "/normal.png", alt: "Visible description" },
      {
        id: "2",
        url: "/hidden.png",
        alt: "Hidden description",
        spoiler: true,
      },
    ]}
    />,
  );
  expect(html).toContain("alt=\"Visible description\"");
  expect(html).not.toContain("/hidden.png");
});

it("keeps optional code highlighting escaped and falls back for unknown languages", () => {
  const highlighted = renderToStaticMarkup(<DiscordUI renderCode={renderHighlightedCode}><Markdown content={"```ts\nconst value = \"<script>\";\n```"} /></DiscordUI>);
  expect(highlighted).toContain("hljs-keyword");
  expect(highlighted).toContain("&lt;script&gt;");
  expect(highlighted).not.toContain("<script>");
  expect(renderToStaticMarkup(<>{renderHighlightedCode("<script>", "not-a-language")}</>)).toBe("<code>&lt;script&gt;</code>");
});

it("rejects executable and protocol-relative URLs while allowing local fixture images", () => {
  for (const url of [
    "javascript:alert(1)",
    "data:text/html,hello",
    "//example.com/image.png",
    "/\\example.com/a",
    "/\n/image.png",
  ]) expect(mediaUrl(url)).toBeUndefined();
  expect(mediaUrl("/landscape.svg")).toBe("/landscape.svg");
  expect(mediaUrl("https://example.com/a.png", false)).toBeUndefined();
  expect(linkUrl("https://arcscord.dev")).toBe("https://arcscord.dev");
});
