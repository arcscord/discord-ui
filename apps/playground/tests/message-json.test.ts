import { describe, expect, it } from "vitest";
import { demoChannel } from "../../../fixtures/channel";
import { basicMessage, scenarios } from "../../../fixtures/messages";
import { parseChannelJson, parseMessageJson, serializeChannel, serializeMessage } from "../src/message-json";

describe("playground JSON model checks", () => {
  it.each(Object.values(scenarios))("accepts the $label fixture", ({ message }) => {
    expect(parseMessageJson(serializeMessage(message))).toEqual({ ok: true, message });
  });

  it("reports invalid syntax without throwing", () => {
    const result = parseMessageJson("{\"author\":");
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error).toContain("JSON invalide");
  });

  it.each([
    null,
    [],
    {},
    { ...basicMessage, author: null },
    {
      ...basicMessage,
      body: { kind: "markdown", content: [] },
    },
    {
      ...basicMessage,
      media: [
        { id: "image", url: 42, alt: "Image" },
      ],
    },
  ])("rejects an unsupported message shape", (value) => {
    expect(parseMessageJson(JSON.stringify(value)).ok).toBe(false);
  });

  it("rejects malformed nested V2 accessories with a useful property path", () => {
    const result = parseMessageJson(JSON.stringify({
      ...basicMessage,
      body: {
        kind: "components-v2",
        components: [
          {
            id: "section",
            kind: "section",
            components: [],
            accessory: { id: "thumb", kind: "thumbnail", media: null },
          },
        ],
      },
    }));
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error).toContain("$.body.components[0].accessory.media");
  });

  it("rejects duplicate sibling identifiers instead of rendering ambiguous React keys", () => {
    const result = parseMessageJson(JSON.stringify({
      ...basicMessage,
      embeds: [
        { id: "same", title: "One" },
        { id: "same", title: "Two" },
      ],
    }));
    expect(result.ok).toBe(false);
    if (!result.ok)
      expect(result.error).toContain("identifiant dupliqué");
  });
});

it("accepts a channel and validates every nested message with an indexed property path", () => {
  expect(parseChannelJson(serializeChannel(demoChannel))).toEqual({ ok: true, channel: demoChannel });
  const invalid = parseChannelJson(JSON.stringify({
    ...demoChannel,
    messages: [
      { ...basicMessage, author: null },
    ],
  }));
  expect(invalid.ok).toBe(false);
  if (!invalid.ok)
    expect(invalid.error).toContain("$.messages[0].author");
});

it("rejects nested threads and orphan thread records", () => {
  const nested = JSON.parse(serializeChannel(demoChannel));
  nested.threads[0].messages[0].thread = nested.messages[2].thread;
  const nestedResult = parseChannelJson(JSON.stringify(nested));
  expect(nestedResult.ok).toBe(false);
  if (!nestedResult.ok)
    expect(nestedResult.error).toContain("ne peuvent pas contenir un autre fil");
  const orphan = JSON.parse(serializeChannel(demoChannel));
  orphan.threads[0].parentMessageId = "missing";
  const orphanResult = parseChannelJson(JSON.stringify(orphan));
  expect(orphanResult.ok).toBe(false);
  if (!orphanResult.ok)
    expect(orphanResult.error).toContain("parentMessageId");
});
