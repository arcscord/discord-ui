import type { ChannelViewModel } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { ChannelHeader, ChannelView, DiscordUI, MessageList } from "../src/index";

const channel: ChannelViewModel = {
  id: "channel",
  name: "example",
  topic: "A channel topic",
  messages: [
    {
      id: "one",
      author: { id: "alice", displayName: "Alice" },
      timestamp: "2026-10-28T23:30:00Z",
      body: { kind: "text", content: "First message" },
    },
    {
      id: "two",
      author: { id: "bob", displayName: "Bob" },
      timestamp: "2026-10-29T00:30:00Z",
      body: { kind: "text", content: "Second message" },
    },
  ],
};

it("renders an ordered channel with header, multiple messages and a prepared composer", () => {
  const html = renderToStaticMarkup(<ChannelView channel={channel} />);
  expect(html).toContain("A channel topic");
  expect(html).toContain("role=\"log\"");
  expect(html.indexOf("First message")).toBeLessThan(html.indexOf("Second message"));
  expect(html).toContain("placeholder=\"Message #example\"");
  expect(html).not.toContain("type=\"submit\"");
});

it("groups date separators using the supplied timezone rather than the host timezone", () => {
  const utc = renderToStaticMarkup(<DiscordUI timeZone="UTC"><MessageList messages={channel.messages} /></DiscordUI>);
  const zurich = renderToStaticMarkup(<DiscordUI timeZone="Europe/Zurich"><MessageList messages={channel.messages} /></DiscordUI>);
  expect(utc.match(/class="dui-date-separator"/gu)).toHaveLength(2);
  expect(zurich.match(/class="dui-date-separator"/gu)).toHaveLength(1);
});

it("supports empty channels, custom header slots and hidden composers", () => {
  const html = renderToStaticMarkup(<ChannelView channel={{ ...channel, messages: [] }} header={<ChannelHeader name="custom" actions={<button type="button">Pinned</button>} />} composer={false} />);
  expect(html).toContain("No messages yet.");
  expect(html).toContain("Pinned");
  expect(html).not.toContain("<textarea");
});
