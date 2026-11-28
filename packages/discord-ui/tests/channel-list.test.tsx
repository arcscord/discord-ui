import type { ChannelCategoryView } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ChannelHeader, ChannelList, DiscordUI, SelectMenu } from "../src/index";

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
        channelType: 2,
        muted: true,
        badge: "3",
      },
    ],
  },
] as const satisfies readonly ChannelCategoryView[];

it("renders categories, channel types, badges and escapes names", () => {
  const html = renderToStaticMarkup(<ChannelList categories={categories} label="Channels" activeChannelId="rules" />);

  expect(html).toContain("aria-label=\"Channels\"");
  expect(html.match(/<h3/gu)).toHaveLength(1);
  expect(html).toContain("aria-current=\"page\"");
  expect(html).toContain("data-muted=\"true\"");
  expect(html).toContain("&lt;lounge&gt;");
  expect(html).toContain("Voice channel");
  expect(html).toContain("<svg");
  expect(html).toContain("dui-channel-list-badge");
});

it("shares native custom icons across lists, headers and selectors", () => {
  const Support = () => <svg data-custom="support" />;
  const Lock = () => <svg data-custom="lock" />;
  const Rules = () => <svg data-custom="rules" />;
  const html = renderToStaticMarkup(
    <DiscordUI
      icons={{
        channelTypes: { support: Support },
        locked: Lock,
        rules: Rules,
      }}
      labels={{
        channelTypes: { support: "Salon support" },
      }}
    >
      <ChannelList categories={[
        {
          id: "group",
          channels: [
            {
              id: "support",
              name: "help",
              channelType: "support",
              locked: true,
            },
            { id: "stage", name: "stage", channelType: 13 },
            { id: "media", name: "media", channelType: 16 },
            { id: "rules", name: "rules", rules: true },
          ],
        },
      ]}
      />
      <ChannelHeader name="help" channelType="support" />
      <SelectMenu menu={{
        id: "menu",
        kind: "channel-select",
        entities: [
          {
            entityType: "channel",
            id: "support",
            name: "help",
            channelType: "support",
          },
        ],
        defaultValues: [
          { id: "support", type: "channel" },
        ],
      }}
      />
    </DiscordUI>,
  );
  expect(html.match(/data-custom="support"/gu)).toHaveLength(3);
  expect(html).toContain("data-custom=\"lock\"");
  expect(html).toContain("data-custom=\"rules\"");
  expect(html).toContain("Salon support");
  expect(html).toContain("Stage channel");
  expect(html).toContain("Media channel");
  expect(html).toContain("class=\"dui-select-channel-icon\" aria-hidden=\"true\"");
});

it("falls back to a text SVG and localized label for unknown custom types", () => {
  const html = renderToStaticMarkup(
    <DiscordUI labels={{ channel: "Salon personnalisé" }}>
      <ChannelList categories={[
        {
          id: "group",
          channels: [
            { id: "custom", name: "custom", channelType: "unknown" },
          ],
        },
      ]}
      />
    </DiscordUI>,
  );
  expect(html).toContain("M10 3 6 21M18 3l-4 18M3 9h18M1 15h18");
  expect(html).toContain("Salon personnalisé");
});

it("offers buttons only when the host handles navigation", () => {
  expect(renderToStaticMarkup(<ChannelList categories={categories} />)).not.toContain("<button");
  expect(renderToStaticMarkup(<ChannelList categories={categories} onChannelClick={() => {}} />).match(/<button/gu)).toHaveLength(2);
});
