import type { MessageView } from "@arcscord/discord-ui-core";
import type { MessageFrameProps } from "../src/index";
import { renderToString } from "@vue/server-renderer";
import { expect, expectTypeOf, it } from "vitest";
import { createSSRApp, h } from "vue";
import { DiscordUI, Message, MessageFrame } from "../src/index";

const base: MessageView = {
  id: "mentioned-message",
  author: { id: "author", displayName: "Author" },
  timestamp: "2026-11-21T09:00:00Z",
  body: { kind: "text", content: "A message" },
};

async function render(message: MessageView, dismiss?: (messageId: string) => void) {
  return renderToString(createSSRApp({
    render: () => h(DiscordUI, {}, {
      default: () => h(Message, {
        message,
        ...(dismiss
          ? { onEphemeralDismiss: dismiss }
          : {}),
      }),
    }),
  }));
}

it("keeps the mentioned model and standalone frame flag optional", async () => {
  expectTypeOf<MessageFrameProps["mentioned"]>().toEqualTypeOf<boolean | undefined>();
  expectTypeOf<MessageView["mentioned"]>().toEqualTypeOf<boolean | undefined>();
  for (const message of [
    base,
    { ...base, mentioned: false },
  ])
    expect(await render(message)).not.toContain("data-mentioned");
  const omitted = await renderToString(createSSRApp({
    render: () => h(MessageFrame),
  }));
  expect(omitted).not.toContain("data-mentioned");
  const explicit = await renderToString(createSSRApp({
    render: () => h(MessageFrame, { mentioned: false }),
  }));
  expect(explicit).not.toContain("data-mentioned");
});

it("marks mentioned messages without ephemeral notices or dismissal controls", async () => {
  const html = await render({ ...base, mentioned: true }, () => {});
  expect(html).toContain("data-mentioned=\"true\"");
  expect(html).not.toContain("data-ephemeral");
  expect(html).not.toContain("dui-ephemeral-notice");
  expect(html).not.toContain("dui-ephemeral-dismiss");
  expect(html).not.toContain("Only you can see this");
});

it("supports the mentioned prop on a standalone frame", async () => {
  const html = await renderToString(createSSRApp({
    render: () => h(MessageFrame, { mentioned: true }, {
      default: () => "Frame content",
    }),
  }));
  expect(html).toContain("data-mentioned=\"true\"");
  expect(html).toContain("Frame content");
  expect(html).not.toContain("data-ephemeral");
  expect(html).not.toContain("dui-ephemeral-notice");
});

it("keeps mentioned and ephemeral flags independent and preserves dismissal availability", async () => {
  const message: MessageView = { ...base, mentioned: true, ephemeral: true };
  const html = await render(message, () => {});
  expect(html).toContain("data-mentioned=\"true\"");
  expect(html).toContain("data-ephemeral=\"true\"");
  expect(html).toContain("dui-ephemeral-notice");
  expect(html).toContain("dui-ephemeral-dismiss");
  expect(html).toContain("Dismiss message");
  expect(html).toContain("Only you can see this");
  expect(await render(message)).not.toContain("dui-ephemeral-dismiss");
});
