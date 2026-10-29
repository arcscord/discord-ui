import type { MessageView } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { Container, DiscordUI, LinkButton, Message, Section, TextDisplay, Thumbnail } from "../src/index";

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
