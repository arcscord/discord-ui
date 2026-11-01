import type { SelectMenuView } from "../packages/discord-ui/src/model/components";

export type SelectMenuExample = {
  id: SelectMenuView["kind"];
  title: string;
  description: string;
  menu: SelectMenuView;
};

export const selectMenuExamples: SelectMenuExample[] = [
  {
    id: "string-select",
    title: "String Select",
    description: "Choose up to three notification topics. Options include descriptions, emoji and a default selection; all topics can be cleared.",
    menu: {
      id: "notification-topics",
      kind: "string-select",
      placeholder: "Choose notification topics",
      minValues: 0,
      maxValues: 3,
      options: [
        {
          value: "releases",
          label: "Releases",
          description: "New versions and release notes",
          emoji: {
            name: "\uD83D\uDE80",
          },
          default: true,
        },
        {
          value: "events",
          label: "Events",
          description: "Community calls and upcoming meetups",
          emoji: {
            name: "\uD83D\uDCC5",
          },
        },
        {
          value: "security",
          label: "Security",
          description: "Security notices and important fixes",
          emoji: {
            name: "\uD83D\uDD12",
          },
        },
        {
          value: "announcements",
          label: "Announcements",
          description: "News from the team",
          emoji: {
            name: "\uD83D\uDCE3",
          },
        },
        {
          value: "tutorials",
          label: "Tutorials",
          description: "Guides, examples and learning resources",
          emoji: {
            name: "\uD83D\uDCDA",
          },
        },
        {
          value: "feedback",
          label: "Feedback",
          description: "Surveys and product discussions",
          emoji: {
            name: "\uD83D\uDCAC",
          },
        },
      ],
    },
  },
  {
    id: "user-select",
    title: "User Select",
    description: "Assign up to three reviewers. Search display names and usernames, compare presence states and app badges, and remove selected users with their chips.",
    menu: {
      id: "reviewers",
      kind: "user-select",
      placeholder: "Choose reviewers",
      minValues: 1,
      maxValues: 3,
      entities: [
        {
          avatarUrl: "/generated/avatars/chris.svg",
          status: "dnd",
          entityType: "user",
          username: "chris",
          id: "chris",
          displayName: "Chris",
        },
        {
          status: "online",
          entityType: "user",
          username: "ines",
          avatarUrl: "/generated/avatars/ines.svg",
          id: "ines",
          displayName: "Inès",
        },
        {
          status: "idle",
          entityType: "user",
          username: "lucas",
          avatarUrl: "/generated/avatars/lucas.svg",
          id: "lucas",
          displayName: "Lucas",
        },
        {
          status: "offline",
          entityType: "user",
          username: "emma",
          avatarUrl: "/generated/avatars/emma.svg",
          id: "emma",
          displayName: "Emma",
        },
        {
          avatarUrl: "/generated/avatars/helper-bot.svg",
          status: "online",
          bot: true,
          verified: true,
          entityType: "user",
          username: "helper_bot",
          id: "helper-bot",
          displayName: "Helper Bot",
        },
        {
          status: "online",
          bot: true,
          entityType: "user",
          username: "music_bot",
          avatarUrl: "/generated/avatars/music-bot.svg",
          id: "music-bot",
          displayName: "Music Bot",
        },
      ],
      defaultValues: [
        {
          id: "chris",
          type: "user",
        },
      ],
    },
  },
  {
    id: "role-select",
    title: "Role Select",
    description: "Choose up to three roles to notify. Discord shows role names and colors, without custom descriptions or emoji.",
    menu: {
      id: "notification-roles",
      kind: "role-select",
      placeholder: "Choose roles to notify",
      minValues: 0,
      maxValues: 3,
      entities: [
        {
          color: "#ed4245",
          entityType: "role",
          id: "admins",
          name: "Administrators",
        },
        {
          color: "#43a66f",
          entityType: "role",
          id: "moderators",
          name: "Moderators",
        },
        {
          color: "#5865f2",
          entityType: "role",
          id: "developers",
          name: "Developers",
        },
        {
          color: "#eb459e",
          entityType: "role",
          id: "designers",
          name: "Designers",
        },
        {
          color: "#f0b232",
          entityType: "role",
          id: "members",
          name: "Members",
        },
        {
          color: "#949ba4",
          entityType: "role",
          id: "guests",
          name: "Guests",
        },
      ],
      defaultValues: [
        {
          id: "members",
          type: "role",
        },
      ],
    },
  },
  {
    id: "mentionable-select",
    title: "Mentionable Select",
    description: "Mix people, apps and roles in one searchable selection, using resolved server entities and typed default values.",
    menu: {
      id: "recipients",
      kind: "mentionable-select",
      placeholder: "Choose people or roles",
      minValues: 0,
      maxValues: 4,
      entities: [
        {
          entityType: "user",
          avatarUrl: "/generated/avatars/chris.svg",
          status: "dnd",
          username: "chris",
          id: "user-chris",
          displayName: "Chris",
        },
        {
          entityType: "role",
          color: "#43a66f",
          id: "role-moderators",
          name: "Moderators",
        },
        {
          entityType: "user",
          status: "online",
          username: "ines",
          avatarUrl: "/generated/avatars/ines.svg",
          id: "ines",
          displayName: "Inès",
        },
        {
          entityType: "role",
          color: "#5865f2",
          id: "role-developers",
          name: "Developers",
        },
        {
          entityType: "user",
          avatarUrl: "/generated/avatars/helper-bot.svg",
          status: "online",
          bot: true,
          verified: true,
          username: "helper_bot",
          id: "helper-bot",
          displayName: "Helper Bot",
        },
        {
          entityType: "user",
          status: "idle",
          username: "lucas",
          avatarUrl: "/generated/avatars/lucas.svg",
          id: "lucas",
          displayName: "Lucas",
        },
      ],
      defaultValues: [
        {
          id: "role-moderators",
          type: "role",
        },
      ],
    },
  },
  {
    id: "channel-select",
    title: "Channel Select",
    description: "Choose destination channels by name. Icons distinguish rules, text, announcement, voice and forum channels; locked channels show their access restriction.",
    menu: {
      id: "destinations",
      kind: "channel-select",
      placeholder: "Choose destination channels",
      minValues: 1,
      maxValues: 3,
      entities: [
        {
          entityType: "channel",
          channelType: 0,
          rules: true,
          id: "general",
          name: "general",
        },
        {
          entityType: "channel",
          channelType: 5,
          locked: true,
          id: "announcements",
          name: "announcements",
        },
        {
          entityType: "channel",
          channelType: 2,
          id: "support",
          name: "support",
        },
        {
          entityType: "channel",
          channelType: 15,
          id: "showcase",
          name: "showcase",
        },
        {
          entityType: "channel",
          channelType: 0,
          locked: true,
          id: "development",
          name: "development",
        },
        {
          entityType: "channel",
          channelType: 13,
          id: "design",
          name: "design",
        },
      ],
      defaultValues: [
        {
          id: "general",
          type: "channel",
        },
      ],
    },
  },
];

// Both playgrounds serve the same generated paths.
export function selectMenuForWebsite(menu: SelectMenuView): SelectMenuView {
  return menu;
}
