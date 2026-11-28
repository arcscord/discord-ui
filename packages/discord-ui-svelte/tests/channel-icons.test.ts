import { channelIconPaths } from "@arcscord/discord-ui-core";
import { render } from "svelte/server";
import { describe, expect, it } from "vitest";
import { ChannelHeader, ChannelList } from "../src/index.js";
import ChannelIconsFixture from "./ChannelIconsFixture.svelte";

describe("svelte channel icons", () => {
  it("inherits native snippets across headers, rows and selected channel options", () => {
    const { body } = render(ChannelIconsFixture);
    expect(body.match(/data-icon="custom"/gu)).toHaveLength(3);
    expect(body.match(/data-icon="locked"/gu)).toHaveLength(3);
    expect(body).toContain("data-icon=\"numeric\"");
    expect(body).toContain("data-icon=\"rules\"");
    expect(body).toContain("class=\"dui-select-channel-icon\" aria-hidden=\"true\"");
    expect(body).toContain("class=\"dui-select-channel-lock\"");
    expect(body).toContain("class=\"dui-sr-only\">Custom room");
    expect(body).toContain("class=\"dui-sr-only\"> (Voice room)");
    expect(body).toContain("<h2 class=\"dui-channel-name\">Header name</h2>");
    expect(body).toContain(`d="${channelIconPaths[13]}"`);
    expect(body).toContain(`d="${channelIconPaths[16]}"`);
  });

  it("defaults headers and rows to text and preserves built-in rules and locks", () => {
    const header = render(ChannelHeader, {
      props: { name: "General" },
    }).body;
    expect(header).toContain(`d="${channelIconPaths[0]}"`);
    const { body } = render(ChannelList, {
      props: {
        categories: [
          {
            id: "category",
            channels: [
              { id: "text", name: "Text" },
              {
                id: "rules",
                name: "Rules",
                rules: true,
                locked: true,
              },
              { id: "unknown", name: "Unknown", channelType: "unknown" },
            ],
          },
        ],
      },
    });
    expect(body.match(new RegExp(`d="${channelIconPaths[0]}"`, "gu"))).toHaveLength(2);
    expect(body).toContain(`d="${channelIconPaths.rules}"`);
    expect(body).toContain(`d="${channelIconPaths.locked}"`);
    expect(body).toContain("class=\"dui-sr-only\"> (Channel)");
  });
});
