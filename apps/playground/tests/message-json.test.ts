import { describe, expect, it } from "vitest";
import { demoChannel } from "../../../fixtures/channel";
import { basicMessage, scenarios } from "../../../fixtures/messages";
import { selectMenuExamples } from "../../../fixtures/select-menus";
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

it.each([-1, 1.5, "12", null])("rejects invalid reaction count %s", (count) => {
  const result = parseMessageJson(JSON.stringify({
    ...basicMessage,
    reactions: [
      {
        id: "like",
        emoji: { name: "👍" },
        count,
      },
    ],
  }));
  expect(result.ok).toBe(false);
  if (!result.ok)
    expect(result.error).toContain("$.reactions[0].count");
});

it.each([
  {
    kind: "string-select",
    options: [
      { value: "x", label: "X" },
      { value: "x", label: "Duplicate" },
    ],
  },
  {
    kind: "user-select",
    options: [],
    minValues: 3,
    maxValues: 1,
  },
  { kind: "role-select", options: [], maxValues: 0 },
  { kind: "unknown-select", options: [] },
  {
    kind: "channel-select",
    options: [
      {
        value: "x",
        label: "X",
        emoji: { name: 123 },
      },
    ],
  },
])("rejects invalid select menu data", (select) => {
  const message = {
    ...basicMessage,
    components: [
      {
        id: "row",
        kind: "action-row",
        select: { id: "menu", ...select },
      },
    ],
  };
  expect(parseMessageJson(JSON.stringify(message)).ok).toBe(false);
});

it.each([
  {
    kind: "user-select",
    entities: [
      {
        id: "u",
        displayName: "User",
        entityType: "user",
        description: "Not supported",
      },
    ],
  },
  {
    kind: "role-select",
    entities: [
      {
        id: "r",
        name: "Role",
        entityType: "role",
        avatarUrl: "/avatar.svg",
      },
    ],
  },
  {
    kind: "user-select",
    entities: [
      { id: "u", name: "Role", entityType: "role" },
    ],
  },
  {
    kind: "channel-select",
    entities: [
      {
        id: "c",
        name: "Channel",
        entityType: "channel",
        channelType: 99,
      },
    ],
  },
  {
    kind: "role-select",
    entities: [],
    channelTypes: [0],
  },
  {
    kind: "user-select",
    entities: [
      { id: "u", displayName: "User", entityType: "user" },
    ],
    defaultValues: [
      { id: "u", type: "role" },
    ],
  },
  {
    kind: "string-select",
    options: [
      { value: "x", label: "X", avatarUrl: "/avatar.svg" },
    ],
  },
])("rejects fields and entities that do not belong to the select kind", (select) => {
  expect(parseMessageJson(JSON.stringify({
    ...basicMessage,
    components: [
      {
        id: "row",
        kind: "action-row",
        select: { id: "menu", ...select },
      },
    ],
  })).ok).toBe(false);
});

it("uses fictional first names and generic app names in the demos", () => {
  for (const example of selectMenuExamples) {
    if (example.menu.kind === "string-select")
      continue;
    for (const entity of example.menu.entities) {
      if (entity.entityType !== "user")
        continue;
      expect(entity.displayName).toMatch(/^(?:Chris|Arcscord|Inès|Lucas|Emma|Helper Bot|Music Bot|Support Bot)$/u);
      expect(entity.username).toMatch(/^(?:chris|ines|lucas|emma|helper_bot|music_bot|support_bot)$/u);
    }
  }
});
