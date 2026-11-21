import type { ComponentProps } from "svelte";
import type { MessageFrame, MessageFrameProps, MessageView } from "../src/index.js";
import { render } from "svelte/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import { Message } from "../src/index.js";
import MentionFrameFixture from "./MentionFrameFixture.svelte";

const message = {
  id: "mentioned-message",
  author: { id: "author", displayName: "Author" },
  timestamp: "2026-11-21T09:00:00Z",
  body: { kind: "text", content: "A regular highlighted message" },
} satisfies MessageView;

describe("mentioned messages", () => {
  it("renders the mentioned marker without ephemeral notice or dismissal controls", () => {
    const { body } = render(Message, {
      props: {
        message: { ...message, mentioned: true },
        onEphemeralDismiss: () => undefined,
      },
    });
    expect(body).toContain("data-mentioned=\"true\"");
    expect(body).toContain("aria-label=\"Mentioned message\"");
    expect(body).toContain("A regular highlighted message");
    expect(body).not.toContain("data-ephemeral");
    expect(body).not.toContain("dui-ephemeral-notice");
    expect(body).not.toContain("dui-ephemeral-dismiss");
    expect(body).not.toContain("Only you can see this");
  });

  it("omits the mentioned marker when omitted or explicitly false", () => {
    for (const view of [
      message,
      { ...message, mentioned: false },
    ]) {
      const { body } = render(Message, {
        props: { message: view },
      });
      expect(body).not.toContain("data-mentioned");
      expect(body).not.toContain("dui-ephemeral-notice");
    }
  });

  it("preserves ephemeral notice and dismissal when both flags are supplied", () => {
    const { body } = render(Message, {
      props: {
        message: { ...message, mentioned: true, ephemeral: true },
        onEphemeralDismiss: () => undefined,
      },
    });
    expect(body).toContain("data-mentioned=\"true\"");
    expect(body).toContain("aria-label=\"Mentioned message\"");
    expect(body).toContain("data-ephemeral=\"true\"");
    expect(body.match(/class="dui-ephemeral-notice"/gu)).toHaveLength(1);
    expect(body.match(/class="dui-ephemeral-dismiss"/gu)).toHaveLength(1);
    expect(body).toContain("Only you can see this");
  });

  it("supports mentioned state on a standalone frame without introducing a footer", () => {
    const { body } = render(MentionFrameFixture, {
      props: { mentioned: true },
    });
    expect(body).toContain("data-mentioned=\"true\"");
    expect(body).toContain("aria-label=\"Mentioned message\"");
    expect(body).toContain("Standalone mentioned frame");
    expect(body).not.toContain("dui-ephemeral-notice");
    expect(body).not.toContain("dui-ephemeral-dismiss");
    expect(render(MentionFrameFixture).body).not.toContain("data-mentioned");
  });

  it("exposes optional serializable mentioned metadata and frame props", () => {
    expectTypeOf<ComponentProps<typeof MessageFrame>>().toEqualTypeOf<MessageFrameProps>();
    expectTypeOf<MessageFrameProps["mentioned"]>().toEqualTypeOf<boolean | undefined>();
    expectTypeOf<MessageView["mentioned"]>().toEqualTypeOf<boolean | undefined>();
    const mentioned = { ...message, mentioned: true } satisfies MessageView;
    expect(JSON.parse(JSON.stringify(mentioned))).toEqual(mentioned);
  });
});

it("localizes the mentioned article name and leaves ordinary articles unnamed", () => {
  const { body } = render(MentionFrameFixture, {
    props: { mentioned: true, label: "Message mentionné" },
  });
  expect(body).toContain("aria-label=\"Message mentionné\"");
  expect(render(MentionFrameFixture).body).not.toMatch(/<article[^>]*aria-label/u);
});
