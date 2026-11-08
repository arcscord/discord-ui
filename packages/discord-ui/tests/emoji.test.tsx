import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Button, DiscordUI, Emoji, LinkButton, Markdown, MessageComponents, MessageContent, Reactions, SelectMenu } from "../src/index";

const content = "❤️ 👍🏽 👨‍👩‍👧‍👦 🇨🇭";
const files = [
  "2764",
  "1f44d-1f3fd",
  "1f468-200d-1f469-200d-1f467-200d-1f466",
  "1f1e8-1f1ed",
];

it("uses native Unicode by default and when explicitly requested", () => {
  for (const node of [<MessageContent key="default" content={content} />, <DiscordUI key="native" unicodeEmoji={{ mode: "native" }}><Markdown content={content} /></DiscordUI>]) {
    const html = renderToStaticMarkup(node);
    expect(html).not.toContain("<img");
    expect(html).not.toContain("cdn");
    for (const emoji of content.split(" ")) expect(html).toContain(emoji);
  }
});

it("uses complete local emoji sequences in plain text and Markdown with remote media disabled", () => {
  for (const body of [<MessageContent key="text" content={content} />, <Markdown key="markdown" content={`**${content}**`} />]) {
    const html = renderToStaticMarkup(<DiscordUI allowRemoteMedia={false} unicodeEmoji={{ mode: "twemoji", baseUrl: "/emojis/twemoji-16.0.1/" }}>{body}</DiscordUI>);
    for (const file of files) expect(html).toContain(`src="/emojis/twemoji-16.0.1/${file}.svg"`);
    expect(html).not.toContain("https:");
  }
});

it("uses the same local emoji source for reactions, primitive buttons and selects", () => {
  const html = renderToStaticMarkup(
    <DiscordUI allowRemoteMedia={false} unicodeEmoji={{ mode: "twemoji", baseUrl: "/emoji" }}>
      <Reactions reactions={[
        {
          id: "wave",
          emoji: { name: "👋" },
          count: 1,
        },
      ]}
      />
      <Button label="" emoji={<Emoji name="👋" />} />
      <SelectMenu menu={{
        id: "select",
        kind: "string-select",
        options: [
          {
            value: "wave",
            label: "Wave",
            emoji: { name: "👋" },
            default: true,
          },
        ],
      }}
      />
    </DiscordUI>,
  );
  expect(html.match(/src="\/emoji\/1f44b.svg"/gu)).toHaveLength(3);
});

it("allows explicit remote sources only when the shared media policy permits them", () => {
  const render = (baseUrl: string, allowRemoteMedia = false) => renderToStaticMarkup(<DiscordUI allowRemoteMedia={allowRemoteMedia} unicodeEmoji={{ mode: "twemoji", baseUrl }}><Emoji name="❤️" /></DiscordUI>);
  for (const base of [
    "https://example.com/emoji",
    "//example.com/emoji",
    "javascript:alert(1)",
    "/\\example.com",
    "",
    "/\n/emoji",
  ]) {
    expect(render(base)).not.toContain("<img");
    expect(render(base)).toContain("❤️");
  }
  expect(render("https://example.com/emoji", true)).toContain("src=\"https://example.com/emoji/2764.svg\"");
});

it("preserves local animated custom entities and falls back to their name when unavailable", () => {
  const html = renderToStaticMarkup(
    <DiscordUI
      allowRemoteMedia={false}
      entities={{
        emojis: {
          "456789012345678901": { name: "dance", image: "/emojis/dance.gif" },
        },
      }}
    >
      <Markdown content="<a:dance:456789012345678901> <:missing:456789012345678902>" />
    </DiscordUI>,
  );
  expect(html).toContain("src=\"/emojis/dance.gif\"");
  expect(html).toContain("alt=\":dance:\"");
  expect(html).toContain("missing");
});

it("labels model buttons from explicit ariaLabel or the emoji name, including inert links", () => {
  const html = renderToStaticMarkup(
    <MessageComponents components={[
      {
        id: "row",
        kind: "action-row",
        buttons: [
          {
            id: "wave",
            kind: "button",
            label: "",
            emoji: { name: "👋" },
          },
          {
            id: "docs",
            kind: "link-button",
            label: "",
            url: "https://example.com",
            emoji: { name: "docs", image: "/docs.svg" },
            ariaLabel: "Open documentation",
          },
          {
            id: "disabled",
            kind: "link-button",
            label: " ",
            url: "https://example.com",
            disabled: true,
            emoji: { name: "locked" },
          },
        ],
      },
    ]}
    />,
  );
  expect(html).toContain("aria-label=\"👋\"");
  expect(html).toContain("aria-label=\"Open documentation\"");
  expect(html).toContain("aria-label=\"locked\"");
  expect(html).toContain("aria-disabled=\"true\"");
  const primitives = renderToStaticMarkup(
    <>
      <Button label="" ariaLabel="Wave" emoji={<Emoji name="👋" />} />
      <LinkButton label="" ariaLabel="Docs" url="https://example.com" emoji={<Emoji name="docs" />} />
    </>,
  );
  expect(primitives).toContain("aria-label=\"Wave\"");
  expect(primitives).toContain("aria-label=\"Docs\"");
});
