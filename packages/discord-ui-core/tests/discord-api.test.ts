import type { APIAttachment, APIMessage, APIMessageTopLevelComponent, APIUser, GatewayMessageCreateDispatchData } from "discord-api-types/v10";
import { ButtonStyle, ChannelType, ComponentType, GuildMemberFlags, MessageFlags, MessageType, SelectMenuDefaultValueType, SeparatorSpacingSize, UserFlags } from "discord-api-types/v10";
import { describe, expect, it } from "vitest";
import { fromDiscordChannel, fromDiscordMessage, fromDiscordMessageComponents, fromDiscordRole, fromDiscordUser } from "../src/discord-api";

const user: APIUser = {
  id: "4194304",
  username: "bridgebot",
  global_name: "Bridge",
  avatar: null,
  discriminator: "0",
  bot: true,
  public_flags: UserFlags.VerifiedBot,
};
const message: APIMessage = {
  id: "29",
  channel_id: "13",
  type: MessageType.Default,
  author: user,
  content: "**Hello**",
  timestamp: "2026-11-16T09:00:00+00:00",
  edited_timestamp: null,
  tts: false,
  mention_everyone: false,
  mention_roles: [],
  mentions: [],
  attachments: [],
  embeds: [],
  pinned: false,
};
const image = {
  id: "30",
  filename: "SPOILER_chart.png",
  url: "https://cdn.discordapp.com/attachments/13/30/SPOILER_chart.png?sig=example",
  proxy_url: "https://media.discordapp.net/attachments/13/30/SPOILER_chart.png",
  size: 1024,
  width: 640,
  height: 480,
  description: "A chart",
  content_type: "image/png",
} satisfies APIAttachment;
const archive = {
  id: "31",
  filename: "SPOILER_archive.zip",
  url: "https://cdn.discordapp.com/attachments/13/31/SPOILER_archive.zip",
  proxy_url: "https://media.discordapp.net/attachments/13/31/SPOILER_archive.zip",
  size: 8192,
  content_type: "application/zip",
} satisfies APIAttachment;

describe("discord API entity conversion", () => {
  it("converts avatars, global names and bot verification flags", () => {
    expect(fromDiscordUser(user)).toEqual({
      id: user.id,
      username: user.username,
      displayName: "Bridge",
      avatarUrl: "https://cdn.discordapp.com/embed/avatars/1.png",
      bot: true,
      verified: true,
    });
    expect(fromDiscordUser({
      ...user,
      global_name: null,
      avatar: "a_animated",
      public_flags: UserFlags.Staff,
      verified: true,
    })).toMatchObject({
      displayName: user.username,
      avatarUrl: "https://cdn.discordapp.com/avatars/4194304/a_animated.gif",
      verified: false,
    });
    expect(fromDiscordUser({ ...user, discriminator: "1234" }).avatarUrl).toBe("https://cdn.discordapp.com/embed/avatars/4.png");
  });

  it("converts a displayed server tag and its badge on message authors", () => {
    const tagged = {
      ...user,
      primary_guild: {
        identity_guild_id: "77",
        identity_enabled: true,
        tag: "DEV",
        badge: "hash",
      },
    };
    expect(fromDiscordMessage({ ...message, author: tagged }).author.tag).toEqual({
      text: "DEV",
      badgeUrl: "https://cdn.discordapp.com/guild-tag-badges/77/hash.png",
    });
    expect(fromDiscordMessage({
      ...message,
      author: {
        ...tagged,
        primary_guild: { ...tagged.primary_guild, badge: null },
      },
    }).author.tag).toEqual({ text: "DEV" });
    expect(fromDiscordMessage({
      ...message,
      author: {
        ...tagged,
        primary_guild: { ...tagged.primary_guild, identity_enabled: false },
      },
    }).author).not.toHaveProperty("tag");
    expect(fromDiscordMessage(message).author).not.toHaveProperty("tag");
  });

  it("prefers a role's primary color and converts named channels", () => {
    const role = { id: "34", name: "Members", color: 0xFF0000 };
    expect(fromDiscordRole(role)).toEqual({ id: "34", name: "Members", color: "#ff0000" });
    expect(fromDiscordRole({
      ...role,
      colors: { primary_color: 7, secondary_color: null, tertiary_color: null },
    }).color).toBe("#000007");
    expect(fromDiscordRole({ ...role, color: 0 })).not.toHaveProperty("color");
    expect(fromDiscordChannel({ id: "13", name: "general", type: ChannelType.GuildText })).toEqual({ id: "13", name: "general", channelType: 0 });
    expect(fromDiscordChannel({ id: "13", type: ChannelType.DM })).toBeUndefined();
    expect(fromDiscordChannel({ id: "13", name: "new", type: 999 as ChannelType })).toBeUndefined();
  });
});

describe("discord API message conversion", () => {
  it("converts classic metadata, image and file attachments, embeds and buttons", () => {
    const source: GatewayMessageCreateDispatchData = {
      ...message,
      guild_id: "14",
      member: {
        roles: [],
        flags: GuildMemberFlags.CompletedOnboarding,
        joined_at: null,
        deaf: false,
        mute: false,
        nick: "Guild Bridge",
        avatar: "guild",
      },
      flags: MessageFlags.Ephemeral,
      edited_timestamp: "2026-11-16T09:01:00+00:00",
      reactions: [
        {
          emoji: { id: "50", name: null, animated: true },
          count: 3,
          count_details: { normal: 2, burst: 1 },
          burst_colors: [],
          me: true,
          me_burst: false,
        },
        {
          emoji: { id: null, name: "👍" },
          count: 1,
          count_details: { normal: 0, burst: 1 },
          burst_colors: [],
          me: false,
          me_burst: true,
        },
      ],
      thread: {
        id: "29",
        name: "Discussion",
        type: ChannelType.PublicThread,
        message_count: 0,
      },
      embeds: [
        {
          title: "Status",
          color: 0,
          image: { url: `attachment://${image.filename}` },
          author: { name: "Bot", icon_url: `attachment://${image.filename}` },
          footer: { text: "Footer", icon_url: "attachment://missing" },
          fields: [
            { name: "State", value: "Ready", inline: true },
          ],
        },
      ],
      attachments: [image, archive],
      components: [
        {
          type: ComponentType.ActionRow,
          id: 8,
          components: [
            {
              type: ComponentType.Button,
              style: ButtonStyle.Success,
              custom_id: "confirm",
              id: 3,
              label: "Confirm",
              disabled: false,
            },
            {
              type: ComponentType.Button,
              style: ButtonStyle.Link,
              url: "https://example.com",
              emoji: { name: "🔗" },
            },
            { type: ComponentType.Button, style: ButtonStyle.Premium, sku_id: "89" },
          ],
        },
      ],
    };
    const view = fromDiscordMessage(source);
    expect(view).toMatchObject({
      author: { displayName: "Guild Bridge", avatarUrl: "https://cdn.discordapp.com/guilds/14/users/4194304/avatars/guild.webp", verified: true },
      edited: true,
      ephemeral: true,
      timestamp: message.timestamp,
      body: { kind: "markdown", content: "**Hello**" },
      reactions: [
        {
          id: "50",
          count: 3,
          emoji: { name: "emoji", image: "https://cdn.discordapp.com/emojis/50.gif" },
          me: true,
        },
        {
          id: "👍",
          count: 1,
          emoji: { name: "👍" },
          me: true,
        },
      ],
      thread: { id: "29", name: "Discussion", messageCount: 0 },
      attachments: [
        {
          id: archive.id,
          kind: "file",
          url: archive.url,
          name: archive.filename,
          size: "8192 B",
          spoiler: true,
        },
      ],
      embeds: [
        {
          title: "Status",
          color: "#000000",
          image: { url: image.url },
          author: { name: "Bot", iconUrl: image.url },
          footer: { text: "Footer" },
          fields: [
            { name: "State", value: "Ready", inline: true },
          ],
        },
      ],
      components: [
        {
          id: "8",
          buttons: [
            {
              id: "confirm",
              kind: "button",
              label: "Confirm",
              style: "success",
              disabled: false,
            },
            {
              id: "component:0.1",
              kind: "link-button",
              emoji: { name: "🔗" },
            },
            { id: "component:0.2", kind: "premium-button", skuId: "89" },
          ],
        },
      ],
    });
    expect(view.media).toBeUndefined();
    const suppressed = fromDiscordMessage({ ...source, flags: MessageFlags.SuppressEmbeds });
    expect(suppressed.embeds).toBeUndefined();
    expect(suppressed.media).toEqual([
      {
        id: image.id,
        url: image.url,
        alt: image.description,
        spoiler: true,
        width: 640,
        height: 480,
      },
    ]);
  });

  it("matches an embedded attachment across CDN and proxy URL variants", () => {
    const standalone = {
      ...image,
      id: "32",
      url: "https://cdn.discordapp.com/attachments/13/32/chart.png",
      proxy_url: "https://media.discordapp.net/attachments/13/32/chart.png",
    };
    const thumbnailUrl = `${image.proxy_url}?width=320`;
    const view = fromDiscordMessage({
      ...message,
      attachments: [image, standalone],
      embeds: [
        {
          thumbnail: { url: thumbnailUrl },
        },
      ],
    });
    expect(view.embeds?.[0]?.thumbnail?.url).toBe(thumbnailUrl);
    expect(view.media?.map(item => item.id)).toEqual([standalone.id]);
  });

  it("distinguishes resolved, deleted and unknown reply references", () => {
    const source = {
      ...message,
      type: MessageType.Reply,
      message_reference: { channel_id: "13", message_id: "12" },
    } satisfies APIMessage;
    expect(fromDiscordMessage(source)).not.toHaveProperty("reply");
    expect(fromDiscordMessage({ ...source, referenced_message: null }).reply).toEqual({ messageId: "12", unavailable: true });
    expect(fromDiscordMessage({
      ...source,
      referenced_message: { ...message, id: "12", content: "Original" },
    }).reply).toMatchObject({
      messageId: "12",
      author: { displayName: "Bridge" },
      content: "Original",
    });
  });

  it("keeps the V2 tree and resolves attachment IDs, filenames and proxy URLs", () => {
    const nodes: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.Container,
        id: 9,
        accent_color: 0x5877FF,
        spoiler: true,
        components: [
          {
            type: ComponentType.Section,
            components: [
              { type: ComponentType.TextDisplay, content: "## Overview" },
            ],
            accessory: {
              type: ComponentType.Thumbnail,
              media: { url: `attachment://${image.filename}` },
              description: "Preview",
            },
          },
          { type: ComponentType.Separator, spacing: SeparatorSpacingSize.Large, divider: false },
          {
            type: ComponentType.File,
            file: { url: "attachment://upload.zip", attachment_id: archive.id },
          },
          {
            type: ComponentType.File,
            file: { url: "attachment://missing" },
          },
          {
            type: ComponentType.MediaGallery,
            items: [
              {
                media: { url: "attachment://remote", proxy_url: "https://media.discordapp.net/example.png" },
              },
              {
                media: { url: "https://example.com/example.mp4", content_type: "video/mp4" },
              },
              {
                media: { url: "attachment://missing" },
              },
            ],
          },
        ],
      },
      { type: 999 } as unknown as APIMessageTopLevelComponent,
    ];
    const source = {
      ...message,
      flags: MessageFlags.IsComponentsV2,
      attachments: [image, archive],
      components: nodes,
    };
    const snapshot = structuredClone(source);
    const view = fromDiscordMessage(source);
    expect(view).not.toHaveProperty("attachments");
    expect(view).not.toHaveProperty("components");
    expect(view.body).toMatchObject({
      kind: "components-v2",
      components: [
        {
          id: "9",
          kind: "container",
          accentColor: "#5877ff",
          spoiler: true,
          components: [
            {
              id: "component:0.0",
              kind: "section",
              components: [
                { kind: "text-display", content: "## Overview" },
              ],
              accessory: {
                kind: "thumbnail",
                media: { url: image.url, alt: "Preview", spoiler: true },
              },
            },
            { kind: "separator", spacing: "large", divider: false },
            {
              kind: "file",
              name: archive.filename,
              url: archive.url,
              spoiler: true,
            },
            {
              kind: "media-gallery",
              items: [
                { url: "https://media.discordapp.net/example.png" },
                { kind: "video", url: "https://example.com/example.mp4" },
              ],
            },
          ],
        },
      ],
    });
    expect(view.body).toEqual({
      kind: "components-v2",
      components: fromDiscordMessageComponents(nodes, { attachments: source.attachments }),
    });
    expect(JSON.parse(JSON.stringify(view))).toEqual(fromDiscordMessage(source));
    expect(source).toEqual(snapshot);
  });

  it("converts string, user, role, mentionable and channel menus with their defaults", () => {
    const rows: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.StringSelect,
            custom_id: "answer",
            placeholder: "Pick",
            min_values: 0,
            options: [
              { value: "ok", label: "OK", default: true },
            ],
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.UserSelect,
            custom_id: "users",
            default_values: [
              { type: SelectMenuDefaultValueType.User, id: user.id },
            ],
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.RoleSelect,
            custom_id: "roles",
            default_values: [
              { type: SelectMenuDefaultValueType.Role, id: "34" },
            ],
          },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          { type: ComponentType.MentionableSelect, custom_id: "mentions" },
        ],
      },
      {
        type: ComponentType.ActionRow,
        components: [
          {
            type: ComponentType.ChannelSelect,
            custom_id: "channels",
            channel_types: [ChannelType.GuildText],
          },
        ],
      },
    ];
    expect(fromDiscordMessageComponents(rows)[1]).toMatchObject({
      select: {
        id: "users",
        entities: [],
        defaultValues: [
          { type: "user", id: user.id },
        ],
      },
    });
    const member = fromDiscordUser(user);
    const role = fromDiscordRole({ id: "34", name: "Members", color: 0 });
    const channel = { id: "13", name: "general", channelType: 0 } as const;
    const view = fromDiscordMessage({ ...message, components: rows }, {
      selectEntities: {
        users: {
          users: [member],
        },
        roles: {
          roles: [role],
        },
        mentions: {
          users: [member],
          roles: [role],
        },
        channels: {
          channels: [channel],
        },
      },
    });
    expect(view.components).toMatchObject([
      {
        select: {
          kind: "string-select",
          id: "answer",
          placeholder: "Pick",
          minValues: 0,
          options: [
            { value: "ok", label: "OK", default: true },
          ],
        },
      },
      {
        select: {
          kind: "user-select",
          entities: [
            { ...member, entityType: "user" },
          ],
        },
      },
      {
        select: {
          kind: "role-select",
          entities: [
            { ...role, entityType: "role" },
          ],
          defaultValues: [
            { id: "34", type: "role" },
          ],
        },
      },
      {
        select: {
          kind: "mentionable-select",
          entities: [
            { ...member, entityType: "user" },
            { ...role, entityType: "role" },
          ],
        },
      },
      {
        select: {
          kind: "channel-select",
          entities: [
            { ...channel, entityType: "channel" },
          ],
          channelTypes: [0],
        },
      },
    ]);
  });
});
