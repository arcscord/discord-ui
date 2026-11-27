import type { ChannelCategoryView } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ChannelList } from "../src/index";

const categories = [
  {
    id: "loose",
    channels: [
      { id: "rules", name: "rules" },
    ],
  },
  {
    id: "voice",
    name: "Voice",
    channels: [
      {
        id: "lounge",
        name: "<lounge>",
        kind: "voice",
        muted: true,
        badge: "3",
      },
    ],
  },
] as const satisfies readonly ChannelCategoryView[];

it("renders categories, kinds, badges and escapes names", () => {
  const html = renderToStaticMarkup(<ChannelList categories={categories} label="Channels" activeChannelId="rules" />);

  expect(html).toContain("aria-label=\"Channels\"");
  expect(html.match(/<h3/gu)).toHaveLength(1);
  expect(html).toContain("aria-current=\"page\"");
  expect(html).toContain("data-muted=\"true\"");
  expect(html).toContain("&lt;lounge&gt;");
  expect(html).toContain("🔊");
  expect(html).toContain("dui-channel-list-badge");
});

it("offers buttons only when the host handles navigation", () => {
  expect(renderToStaticMarkup(<ChannelList categories={categories} />)).not.toContain("<button");
  expect(renderToStaticMarkup(<ChannelList categories={categories} onChannelClick={() => {}} />).match(/<button/gu)).toHaveLength(2);
});
