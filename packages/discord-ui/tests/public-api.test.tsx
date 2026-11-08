import type { ChannelViewModel, ComponentHandlers, MessageView, SelectValuesByMessage } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, expectTypeOf, it } from "vitest";
import { ChannelView, DiscordUI, Message, MessageComponents, SelectMenu } from "../src/index";

const message = {
  id: "starter",
  author: { id: "bot", displayName: "Bot" },
  timestamp: "2026-11-03T12:00:00Z",
  body: {
    kind: "components-v2",
    components: [
      {
        id: "row",
        kind: "action-row",
        select: {
          id: "pick",
          kind: "string-select",
          options: [
            { value: "a", label: "Alpha", default: true },
            { value: "b", label: "Beta" },
          ],
        },
      },
    ],
  },
  thread: { id: "thread", name: "Controlled thread", messageCount: 1 },
} as const satisfies MessageView;
const immutableChannel = {
  id: "channel",
  name: "general",
  messages: [message],
  threads: [
    {
      id: "thread",
      name: "Controlled thread",
      parentMessageId: "starter",
      messages: [
        {
          id: "reply",
          author: message.author,
          timestamp: message.timestamp,
          body: message.body,
        },
      ],
    },
  ],
} as const satisfies ChannelViewModel;

it("blocks remote user-select avatars and localizes its accessible controls", () => {
  const html = renderToStaticMarkup(
    <DiscordUI
      allowRemoteMedia={false}
      labels={{
        channelSelectPlaceholder: "Choisir un salon",
        selectPlaceholder: "Choisir",
        removeSelection: "Retirer {name}",
        userOnline: "En ligne",
      }}
    >
      <SelectMenu menu={{
        id: "users",
        kind: "user-select",
        minValues: 0,
        entities: [
          {
            id: "alice",
            displayName: "Alice",
            entityType: "user",
            status: "online",
            avatarUrl: "https://example.com/alice.png",
          },
        ],
        defaultValues: [
          { id: "alice", type: "user" },
        ],
      }}
      />
      <SelectMenu menu={{ id: "channels", kind: "channel-select", entities: [] }} />
    </DiscordUI>,
  );
  expect(html).not.toContain("https://example.com/alice.png");
  expect(html).toContain("aria-label=\"Choisir\"");
  expect(html).toContain("aria-label=\"Retirer Alice\"");
  expect(html).toContain("aria-label=\"Choisir un salon\"");
});

it("propagates controlled values through messages, channels and opened thread replies", () => {
  const selectValuesByMessage: SelectValuesByMessage = {
    starter: {
      pick: ["b"],
    },
    reply: {
      pick: ["b"],
    },
  };
  const direct = renderToStaticMarkup(
    <Message
      message={message}
      selectValues={{
        pick: ["b"],
      }}
    />,
  );
  expect(direct).toContain("class=\"dui-select-value\">Beta");
  const html = renderToStaticMarkup(<ChannelView channel={immutableChannel} activeThreadId="thread" selectValuesByMessage={selectValuesByMessage} />);
  expect(html.match(/class="dui-select-value">Beta/gu)).toHaveLength(3);
  expect(html).toContain("dui-thread-panel");
  expect(renderToStaticMarkup(<ChannelView channel={immutableChannel} activeThreadId={null} />)).not.toContain("dui-thread-panel");
});

it("accepts immutable conversation snapshots and existing callback arities", () => {
  const legacy = {
    onButtonClick: (_id: string) => {},
    onSelectChange: (_id: string, _values: string[]) => {},
    onPremiumClick: (_skuId: string) => {},
  };
  expectTypeOf(legacy).toExtend<ComponentHandlers>();
  expectTypeOf(immutableChannel).toExtend<ChannelViewModel>();
});

it("treats inherited object keys as uncontrolled selects, not selection arrays", () => {
  const html = renderToStaticMarkup(
    <MessageComponents
      selectValues={{}}
      components={[
        {
          id: "row",
          kind: "action-row",
          select: {
            id: "constructor",
            kind: "string-select",
            options: [
              { value: "a", label: "Alpha", default: true },
            ],
          },
        },
      ]}
    />,
  );
  expect(html).toContain("class=\"dui-select-value\">Alpha");
});

it("keeps shared model identities compatible across React and core imports", () => {
  expectTypeOf<MessageView>().toEqualTypeOf<import("@arcscord/discord-ui-core").MessageView>();
  expectTypeOf<ComponentHandlers>().toEqualTypeOf<import("@arcscord/discord-ui-core").ComponentHandlers>();
  expectTypeOf<import("../src/index").DisplayOptions>().toExtend<import("@arcscord/discord-ui-core").BaseDisplayOptions>();
});
