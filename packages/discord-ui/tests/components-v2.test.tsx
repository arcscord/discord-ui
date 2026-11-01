import type { MessageView } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Container, DiscordUI, File, LinkButton, Message, Section, TextDisplay, Thumbnail } from "../src/index";

it("renders a typed V2 message with sections, thumbnail, gallery and link buttons", () => {
  const message: MessageView = {
    id: "v2",
    author: { id: "1", displayName: "Arcscord" },
    timestamp: "2026-10-29T18:00:00Z",
    body: {
      kind: "components-v2",
      components: [
        {
          id: "card",
          kind: "container",
          accentColor: "#5865f2",
          components: [
            {
              id: "section",
              kind: "section",
              components: [
                { id: "title", kind: "text-display", content: "# V2 title" },
              ],
              accessory: {
                id: "thumb",
                kind: "thumbnail",
                media: { id: "thumb-image", url: "/emoji.svg", alt: "Accessory" },
              },
            },
            {
              id: "gallery",
              kind: "media-gallery",
              items: [
                { id: "media", url: "/landscape.svg", alt: "Gallery image" },
              ],
            },
            { id: "divider", kind: "separator" },
            {
              id: "row",
              kind: "action-row",
              buttons: [
                {
                  id: "docs",
                  kind: "link-button",
                  label: "Docs",
                  url: "https://arcscord.dev",
                },
              ],
            },
          ],
        },
      ],
    },
  };
  const html = renderToStaticMarkup(<DiscordUI><Message message={message} /></DiscordUI>);
  expect(html).toContain("dui-container-accented");
  expect(html).toContain("V2 title");
  expect(html).toContain("alt=\"Accessory\"");
  expect(html).toContain("alt=\"Gallery image\"");
  expect(html).toContain("role=\"separator\"");
  expect(html).toContain("href=\"https://arcscord.dev\"");
});

it("keeps disabled and unsafe link buttons inert", () => {
  const buttons = [
    { label: "Disabled", url: "https://arcscord.dev", disabled: true },
    { label: "Unsafe", url: "javascript:alert(1)" },
  ];
  const html = renderToStaticMarkup(<>{buttons.map(props => <LinkButton key={props.label} {...props} />)}</>);
  expect(html).not.toContain("href=");
  expect(html).not.toContain("javascript:");
  expect(html.match(/aria-disabled="true"/gu)).toHaveLength(2);
});

it("supports standalone composition without a hidden slot protocol", () => {
  const html = renderToStaticMarkup(<Container><Section accessory={<Thumbnail media={{ id: "1", url: "/emoji.svg", alt: "Thumb" }} />}><TextDisplay content="**Composed**" /></Section></Container>);
  expect(html).toContain("<strong>Composed</strong>");
  expect(html).not.toContain("dui-container-accented");
});

it("renders classic action rows and default selections", () => {
  const message: MessageView = {
    id: "classic",
    author: { id: "1", displayName: "Bot" },
    timestamp: "2026-10-29T18:00:00Z",
    body: { kind: "text", content: "Classic controls" },
    components: [
      {
        id: "row",
        kind: "action-row",
        select: {
          id: "users",
          kind: "user-select",
          entities: [
            { id: "alice", displayName: "Alice", entityType: "user" },
          ],
          defaultValues: [
            { id: "alice", type: "user" },
          ],
        },
      },
    ],
  };
  const html = renderToStaticMarkup(<DiscordUI><Message message={message} /></DiscordUI>);
  expect(html).toContain("Classic controls");
  expect(html).toContain("role=\"combobox\"");
  expect(html).toContain("dui-select-chip");
  expect(html).toContain("Alice");
});

it("does not expose unsafe file URLs and keeps spoiler files concealed", () => {
  const html = renderToStaticMarkup(
    <File file={{
      id: "unsafe",
      kind: "file",
      name: "Unsafe file",
      url: "javascript:alert(1)",
    }}
    />,
  );
  expect(html).toContain("Unsafe file");
  expect(html).not.toContain("href=");
  expect(html).not.toContain("javascript:");
  const hidden = renderToStaticMarkup(
    <DiscordUI>
      <File file={{
        id: "spoiler",
        kind: "file",
        name: "Hidden file",
        url: "https://example.com/file",
        spoiler: true,
      }}
      />
    </DiscordUI>,
  );
  expect(hidden).not.toContain("Hidden file");
});
