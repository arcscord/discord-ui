import { describe, expect, it } from "vitest";
import { appendMessage, classicExtras, classicMessage, createLocalState, defaultConfig, initialChannel, interactionMessage, parseConfig, scenarioMessages, scenarios } from "../../../fixtures/comparison/scenarios";
import { isConfigureMessage, isFrameMessage, protocol, snapshot } from "../src/previews/protocol";

describe("comparison fixtures and transport", () => {
  it("covers twelve distinct scenario families in the base matrix", () => {
    expect(scenarios).toHaveLength(12);
    expect(new Set(scenarios.map(scenario => scenario.id)).size).toBe(12);
    expect(scenarios.length * 3 * 2).toBe(72);
    expect(scenarios.length * 3 * 2 * 3).toBe(216);
  });

  it("round-trips custom theme configuration and rejects invalid flags", () => {
    const parsed = parseConfig(new URLSearchParams("scenario=embeds&customTheme=true"));
    expect(parsed.fallback).toBe(false);
    expect(parsed.config.customTheme).toBe(true);
    expect(parseConfig(new URLSearchParams("customTheme=unknown")).fallback).toBe(true);
    expect(isConfigureMessage({
      protocol,
      framework: "vue",
      revision: 1,
      type: "configure",
      config: parsed.config,
      reset: true,
    })).toBe(true);
  });
  it("keeps fixtures serializable, resettable and independent between native hosts", () => {
    const fixtures = {
      classicMessage,
      classicExtras,
      interactionMessage,
      scenarioMessages,
      initialChannel,
      scenarios,
    };
    expect(JSON.parse(JSON.stringify(fixtures))).toEqual(fixtures);
    const first = createLocalState();
    const second = createLocalState();
    first.selectValues = {
      ...first.selectValues,
      topics: ["maps"],
    };
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

  it("omits uncontrolled selection keys from transport snapshots", () => {
    const state = createLocalState();
    state.selectValues = { topics: [], ownership: undefined };
    const observed = snapshot(state);
    expect(observed.selectValues).toEqual({ topics: [] });
    expect(isFrameMessage({
      protocol,
      framework: "react",
      revision: 1,
      type: "applied",
      state: observed,
    })).toBe(true);
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
      { ...defaultConfig, customTheme: "true" },
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
