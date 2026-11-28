import type { ChannelEntityView, ChannelIcons, ChannelListItemView } from "../src/index";
import { expect, it } from "vitest";
import { channelIconPaths, defaultDisplayOptions, getChannelTypeLabel, resolveChannelIcon, selectOptions } from "../src/index";

it("accepts native and custom channel types in lists, entities and selector filters", () => {
  const custom: ChannelListItemView = { id: "support", name: "support", channelType: "support" };
  const entity: ChannelEntityView = { ...custom, channelType: "support" };
  const options = selectOptions({
    id: "menu",
    kind: "channel-select",
    channelTypes: ["support", 42],
    entities: [
      { ...entity, entityType: "channel" },
      {
        entityType: "channel",
        id: "custom-number",
        name: "custom number",
        channelType: 42,
      },
      {
        entityType: "channel",
        id: "text",
        name: "general",
        channelType: 0,
      },
    ],
  });
  expect(options.map(option => option.value)).toEqual(["support", "custom-number"]);
});

it("resolves partial overrides and preserves built-in paths and rules precedence", () => {
  const icons: ChannelIcons<string> = {
    channelTypes: { support: "support-icon", 42: "custom-icon", 13: "stage-icon" },
    rules: "rules-icon",
  };
  expect(resolveChannelIcon({ channelType: "support" }, icons).icon).toBe("support-icon");
  expect(resolveChannelIcon({ channelType: 42 }, icons).icon).toBe("custom-icon");
  expect(resolveChannelIcon({ channelType: 13 }, icons).icon).toBe("stage-icon");
  expect(resolveChannelIcon({ channelType: "support", rules: true }, icons)).toEqual({ path: channelIconPaths.rules, icon: "rules-icon" });
  expect(resolveChannelIcon({ channelType: 16 }, icons)).toEqual({ path: channelIconPaths[16], icon: undefined });
  expect(resolveChannelIcon({})).toEqual({ path: channelIconPaths[0], icon: undefined });
});

it.each([
  "unknown",
  "rules",
  "locked",
  "constructor",
  "__proto__",
  "toString",
])("safely falls back for the custom type %s", (channelType) => {
  expect(resolveChannelIcon({ channelType }, { channelTypes: {} })).toEqual({ path: channelIconPaths[0], icon: undefined });
  expect(getChannelTypeLabel(channelType)).toBe("Channel");
});

it("uses localized type names, built-in defaults and a localized generic fallback", () => {
  expect(getChannelTypeLabel(13)).toBe("Stage channel");
  expect(getChannelTypeLabel(16)).toBe("Media channel");
  const labels = {
    ...defaultDisplayOptions.labels,
    channel: "Salon",
    channelTypes: { 13: "Scène", support: "Support" },
  };
  expect(getChannelTypeLabel(13, labels)).toBe("Scène");
  expect(getChannelTypeLabel("support", labels)).toBe("Support");
  expect(getChannelTypeLabel(16, labels)).toBe("Media channel");
  expect(getChannelTypeLabel(42, labels)).toBe("Salon");
});
