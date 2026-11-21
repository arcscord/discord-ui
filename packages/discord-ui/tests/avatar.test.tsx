import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Author, Avatar, DiscordUI } from "../src/index";

it("generates a configurable single-grapheme avatar with a stable background", () => {
  const author = {
    id: "alex",
    displayName: "Alex",
    avatarFallback: { letter: "👩🏽‍💻", background: "#337c96", color: "#ffcc00" },
  };
  const html = renderToStaticMarkup(<Avatar author={author} />);
  expect(html).toContain("background:#337c96;color:#ffcc00");
  expect(html).toContain("<span>👩🏽‍💻</span>");
  expect(html).not.toContain("<img");
  const fallback = renderToStaticMarkup(<Avatar author={{ id: "alex", displayName: "Alex" }} />);
  expect(fallback).toContain("<span>A</span>");
  expect(renderToStaticMarkup(<Avatar author={{ id: "alex", displayName: "alex" }} />)).toBe(fallback);
});

it("uses custom avatar fallback when remote images are blocked", () => {
  const html = renderToStaticMarkup(
    <DiscordUI allowRemoteMedia={false}>
      <Avatar author={{
        id: "1",
        displayName: "Bot",
        avatarUrl: "https://example.com/bot.png",
        avatarFallback: { letter: "Z", background: "#123456" },
      }}
      />
    </DiscordUI>,
  );
  expect(html).toContain("<span>Z</span>");
  expect(html).toContain("background:#123456");
  expect(html).not.toContain("https://example.com");
});

it("escapes avatar text, rejects invalid colors and handles empty names", () => {
  const html = renderToStaticMarkup(
    <Avatar author={{
      id: "1",
      displayName: "",
      avatarFallback: { letter: "<script>", background: "url(https://example.com)", color: "red" },
    }}
    />,
  );
  expect(html).toContain("<span>&lt;</span>");
  expect(html).not.toContain("url(");
  expect(html).toContain("color:#ffffff");
  expect(renderToStaticMarkup(<Avatar author={{ id: "1", displayName: " " }} />)).toContain("<span>?</span>");
});

it("renders an author server tag with an optional badge subject to the media policy", () => {
  const author = {
    id: "chris",
    displayName: "Chris",
    tag: { text: "DEV", badgeUrl: "https://example.com/tag.png" },
  };
  const html = renderToStaticMarkup(<Author author={author} />);
  expect(html).toContain("<span class=\"dui-author-tag\"><img class=\"dui-author-tag-badge\" src=\"https://example.com/tag.png\" alt=\"\" width=\"13\" height=\"13\"/><span class=\"dui-author-tag-text\">DEV</span></span>");
  const blocked = renderToStaticMarkup(<DiscordUI allowRemoteMedia={false}><Author author={author} /></DiscordUI>);
  expect(blocked).toContain("<span class=\"dui-author-tag\"><span class=\"dui-author-tag-text\">DEV</span></span>");
  expect(blocked).not.toContain("example.com");
  expect(renderToStaticMarkup(<Author author={{ id: "sam", displayName: "Sam" }} />)).not.toContain("dui-author-tag");
});
