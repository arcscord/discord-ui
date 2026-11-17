import { describe, expect, it } from "vitest";
import { appendMessage, classicMessage, createLocalState, defaultConfig, initialChannel, interactionMessage, parseConfig, scenarios } from "../../../fixtures/comparison/scenarios";
import { isConfigureMessage, isFrameMessage, protocol, snapshot } from "../src/comparison/protocol";

describe("comparison fixtures and transport", () => {
  it("keeps fixtures serializable, resettable and independent between native hosts", () => {
    const fixtures = {
      classicMessage,
      interactionMessage,
      initialChannel,
      scenarios,
    };
    expect(JSON.parse(JSON.stringify(fixtures))).toEqual(fixtures);
    const first = createLocalState();
    const second = createLocalState();
    first.selectValues.topics = ["maps"];
    first.channel = appendMessage(first.channel, "Hello");
    first.channel = appendMessage(first.channel, "Reply", "discussion");
    expect(snapshot(first)).toMatchObject({ messageCount: 2, replyCount: 1 });
    expect(snapshot(second)).toMatchObject({
      messageCount: 1,
      replyCount: 0,
      selectValues: { topics: [] },
    });
    expect(initialChannel.messages).toHaveLength(1);
    expect(first.channel.messages[0]?.thread?.messageCount).toBe(1);
  });

  it("parses supported URL values and reports unknown settings", () => {
    expect(parseConfig(new URLSearchParams())).toEqual({ config: defaultConfig, fallback: false });
    expect(parseConfig(new URLSearchParams("scenario=channel&theme=light&locale=fr-FR&media=allow"))).toEqual({
      config: {
        scenario: "channel",
        theme: "light",
        locale: "fr-FR",
        allowRemoteMedia: true,
      },
      fallback: false,
    });
    expect(parseConfig(new URLSearchParams("scenario=unknown&theme=unknown&locale=unknown&media=unknown"))).toEqual({ config: defaultConfig, fallback: true });
  });

  it("rejects malformed, foreign-version and invalid-revision messages", () => {
    const base = { protocol, framework: "react", revision: 1 };
    const configure = {
      ...base,
      type: "configure",
      config: defaultConfig,
      reset: true,
    };
    expect(isConfigureMessage(configure)).toBe(true);
    for (const config of [
      null,
      {},
      { ...defaultConfig, theme: "unknown" },
      { ...defaultConfig, scenario: "" },
      { ...defaultConfig, locale: "" },
      { ...defaultConfig, allowRemoteMedia: "true" },
    ])
      expect(isConfigureMessage({ ...configure, config })).toBe(false);
    for (const revision of [-1, 1.5, "1", NaN, Infinity])
      expect(isConfigureMessage({ ...configure, revision })).toBe(false);
    expect(isConfigureMessage({ ...configure, protocol: "v0" })).toBe(false);
    expect(isConfigureMessage({ ...configure, framework: "unknown" })).toBe(false);
    const state = snapshot(createLocalState());
    expect(isFrameMessage({ ...base, type: "applied", state })).toBe(true);
    expect(isFrameMessage({
      ...base,
      type: "applied",
      state: {
        ...state,
        selectValues: {
          topics: [1],
        },
      },
    })).toBe(false);
    expect(isFrameMessage({
      ...base,
      type: "event",
      event: { name: "unknown", args: [] },
      state,
    })).toBe(false);
    expect(isFrameMessage({ ...base, type: "error", error: {} })).toBe(false);
  });
});
