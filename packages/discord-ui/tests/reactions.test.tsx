import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DiscordUI, Emoji, Markdown, Message, MessageContent, Reactions } from "../src/index";

it("renders complex Unicode emoji consistently while leaving code literal and text escaped", () => {
  const content = "Hello 👩🏽‍💻 ❤️ 🇨🇭 <script>";
  const plain = renderToStaticMarkup(<MessageContent content={content} />);
  expect(plain).toContain("1f469-1f3fd-200d-1f4bb.svg");
  expect(plain).toContain("2764.svg");
  expect(plain).toContain("1f1e8-1f1ed.svg");
  expect(plain).toContain("&lt;script&gt;");
  expect(plain).not.toContain("@latest");
  const markdown = renderToStaticMarkup(<Markdown content={"**👩🏽‍💻** `❤️`\n```\n🇨🇭\n```"} />);
  expect(markdown).toContain("1f469-1f3fd-200d-1f4bb.svg");
  expect(markdown).toContain("<code class=\"dui-inline-code\">❤️</code>");
  expect(markdown).toContain("<code>🇨🇭</code>");
});

it("preserves Unicode when remote media is disabled and keeps custom emoji fallbacks", () => {
  const html = renderToStaticMarkup(
    <DiscordUI allowRemoteMedia={false}>
      <Emoji name="👍" />
      <Emoji name="arc" image="https://example.com/arc.png" />
    </DiscordUI>,
  );
  expect(html).toContain("👍");
  expect(html).toContain(":arc:");
  expect(html).not.toContain("<img");
});

it("supports read-only, selected and interactive reactions on V2 messages without showing empty counts", () => {
  const reactions = [
    {
      id: "like",
      emoji: { name: "👍" },
      count: 12,
      me: true,
    },
    {
      id: "empty",
      emoji: { name: "❤️" },
      count: 0,
    },
  ];
  const readonly = renderToStaticMarkup(<Reactions reactions={reactions} />);
  expect(readonly).toContain("data-selected=\"true\"");
  expect(readonly).not.toContain("<button");
  expect(readonly).not.toContain("❤️");
  const interactive = renderToStaticMarkup(
    <Message
      message={{
        id: "v2",
        timestamp: "2026-10-29T18:00:00Z",
        author: { id: "a", displayName: "A" },
        body: { kind: "components-v2", components: [] },
        reactions,
      }}
      onReactionToggle={() => {}}
    />,
  );
  expect(interactive).toContain("aria-pressed=\"true\"");
  expect(interactive).toContain("aria-label=\"👍: 12\"");
});
