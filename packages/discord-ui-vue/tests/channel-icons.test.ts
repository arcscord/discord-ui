import { channelIconPaths } from "@arcscord/discord-ui-core";
import { renderToString } from "@vue/server-renderer";
import { expect, it, onTestFinished, vi } from "vitest";
import { createSSRApp, defineComponent, h } from "vue";
import { ChannelHeader, ChannelList, DiscordUI, SelectMenu } from "../src/index";

it("renders built-in channel paths and accessible type labels", async () => {
  const html = await renderToString(createSSRApp({
    render: () => h(DiscordUI, {}, {
      default: () => h(ChannelList, {
        categories: [
          {
            id: "channels",
            channels: [
              { id: "text", name: "general" },
              { id: "stage", name: "stage", channelType: 13 },
              { id: "media", name: "media", channelType: 16 },
            ],
          },
        ],
      }),
    }),
  }));
  for (const type of [0, 13, 16])
    expect(html).toContain(`d="${channelIconPaths[type]}"`);
  expect(html).toContain("class=\"dui-sr-only\"");
  expect(html).toContain("class=\"dui-select-channel-icon\" aria-hidden=\"true\"");
});

it("uses native custom icons and labels across header, list and select", async () => {
  const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
  onTestFinished(() => warning.mockRestore());
  const Custom = defineComponent(() => () => h("svg", { "data-custom": "support" }, [
    h("title", "Custom support"),
  ]));
  const Lock = defineComponent(() => () => h("svg", { "data-custom": "lock" }));
  const icons = {
    channelTypes: { support: Custom },
    locked: Lock,
  };
  const html = await renderToString(createSSRApp({
    render: () => h(DiscordUI, {
      icons,
      labels: {
        channelTypes: { support: "Support channel" },
      },
    }, {
      default: () => [
        h(ChannelHeader, { name: "help", channelType: "support", locked: true }),
        h(ChannelList, {
          categories: [
            {
              id: "channels",
              channels: [
                { id: "help", name: "help", channelType: "support" },
              ],
            },
          ],
        }),
        h(SelectMenu, {
          values: ["help"],
          menu: {
            kind: "channel-select",
            id: "channels",
            entities: [
              {
                entityType: "channel",
                id: "help",
                name: "help",
                channelType: "support",
              },
            ],
          },
        }),
      ],
    }),
  }));
  expect(html.match(/data-custom="support"/gu)).toHaveLength(3);
  expect(html).toContain("data-custom=\"lock\"");
  expect(html.match(/Support channel/gu)).toHaveLength(2);
  expect(html).toContain("<h2 class=\"dui-channel-name\">help</h2>");
  expect(warning).not.toHaveBeenCalled();
});
