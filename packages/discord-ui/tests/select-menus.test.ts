import type { ChannelSelectMenuView, RoleView } from "../src/index";
import { expect, it } from "vitest";
import { defaultSelectValues, selectOptions } from "../src/utils/select-menus";

it("filters resolved channel types and normalizes shared entity identities", () => {
  const menu: ChannelSelectMenuView = {
    id: "channels",
    kind: "channel-select",
    channelTypes: [0, 5],
    entities: [
      {
        id: "text",
        name: "general",
        entityType: "channel",
        channelType: 0,
      },
      {
        id: "voice",
        name: "lounge",
        entityType: "channel",
        channelType: 2,
      },
      {
        id: "news",
        name: "announcements",
        entityType: "channel",
        channelType: 5,
      },
    ],
    defaultValues: [
      { id: "text", type: "channel" },
    ],
  };
  expect(selectOptions(menu).map(option => option.value)).toEqual(["text", "news"]);
  expect(defaultSelectValues(menu)).toEqual(["text"]);
  const role: RoleView = { id: "staff", name: "Staff", color: "#43a66f" };
  expect(selectOptions({
    id: "roles",
    kind: "role-select",
    entities: [
      { ...role, entityType: "role" },
    ],
  })[0]).toMatchObject({ value: "staff", label: "Staff" });
});
