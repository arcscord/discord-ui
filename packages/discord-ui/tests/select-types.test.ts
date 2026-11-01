import type { ChannelSelectMenuView, MentionableSelectMenuView, RoleSelectMenuView, StringSelectMenuView, UserSelectMenuView } from "../src/index";
import { expectTypeOf, it } from "vitest";

it("restricts resolved entities, defaults and option metadata by select kind", () => {
  expectTypeOf<UserSelectMenuView["options"]>().toEqualTypeOf<undefined>();
  expectTypeOf<StringSelectMenuView["defaultValues"]>().toEqualTypeOf<undefined>();
  expectTypeOf<UserSelectMenuView["entities"][number]["description"]>().toEqualTypeOf<undefined>();
  expectTypeOf<RoleSelectMenuView["entities"][number]["avatarUrl"]>().toEqualTypeOf<undefined>();
  expectTypeOf<ChannelSelectMenuView["entities"][number]["emoji"]>().toEqualTypeOf<undefined>();
  expectTypeOf<NonNullable<UserSelectMenuView["defaultValues"]>[number]["type"]>().toEqualTypeOf<"user">();
  expectTypeOf<NonNullable<MentionableSelectMenuView["defaultValues"]>[number]["type"]>().toEqualTypeOf<"user" | "role">();
  expectTypeOf<NonNullable<ChannelSelectMenuView["channelTypes"]>[number]>().exclude<0 | 1 | 2 | 3 | 4 | 5 | 10 | 11 | 12 | 13 | 14 | 15 | 16>().toBeNever();
  const users: UserSelectMenuView = {
    id: "users",
    kind: "user-select",
    entities: [
      // @ts-expect-error A user menu cannot contain roles.
      { id: "role", name: "Role", entityType: "role" },
    ],
  };
  const channels: ChannelSelectMenuView = {
    id: "channels",
    kind: "channel-select",
    entities: [
      {
        id: "general",
        name: "general",
        entityType: "channel",
        channelType: 0,
        // @ts-expect-error Only string options accept descriptions.
        description: "Unsupported",
      },
    ],
  };
  const roles: RoleSelectMenuView = {
    id: "roles",
    kind: "role-select",
    entities: [],
    // @ts-expect-error A role menu cannot have channel filtering.
    channelTypes: [0],
  };
  void users;
  void channels;
  void roles;
});
