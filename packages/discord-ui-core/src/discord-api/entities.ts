import type { APIPartialChannel, APIRole, APIUser } from "discord-api-types/v10";
import type { ChannelEntityView, ChannelType, RoleView, UserView } from "../model/entities";
import { CDNRoutes, ImageFormat, RouteBases, UserFlags } from "discord-api-types/v10";

export function hexColor(color: number): string {
  return `#${color.toString(16).padStart(6, "0")}`;
}

function avatarFormat(hash: string): ImageFormat.GIF | ImageFormat.WebP {
  return hash.startsWith("a_")
    ? ImageFormat.GIF
    : ImageFormat.WebP;
}

export function guildAvatarUrl(guildId: string, userId: string, hash: string): string {
  return RouteBases.cdn + CDNRoutes.guildMemberAvatar(guildId, userId, hash, avatarFormat(hash));
}

function userAvatarUrl(user: APIUser): string {
  if (user.avatar)
    return RouteBases.cdn + CDNRoutes.userAvatar(user.id, user.avatar, avatarFormat(user.avatar));

  const index = user.discriminator && user.discriminator !== "0"
    ? Number(user.discriminator) % 5
    : Number((BigInt(user.id) >> 22n) % 6n);
  return `${RouteBases.cdn}/embed/avatars/${index}.png`;
}

export function discordUserIdentity(user: APIUser): Required<Pick<UserView, "id" | "displayName" | "avatarUrl" | "bot" | "verified">> {
  const flags = user.public_flags ?? user.flags ?? 0;
  return {
    id: user.id,
    displayName: user.global_name || user.username,
    avatarUrl: userAvatarUrl(user),
    bot: user.bot ?? false,
    verified: Boolean(flags & UserFlags.VerifiedBot),
  };
}

/** Convert a Discord user to identity data for authors, avatars and entity menus. */
export function fromDiscordUser(user: APIUser): UserView {
  return {
    ...discordUserIdentity(user),
    username: user.username,
  };
}

/** Convert a role's name and primary display color. */
export function fromDiscordRole(role: Pick<APIRole, "id" | "name" | "color"> & Partial<Pick<APIRole, "colors">>): RoleView {
  const color = role.colors?.primary_color ?? role.color;
  return {
    id: role.id,
    name: role.name,
    ...(color
      ? {
          color: hexColor(color),
        }
      : {}),
  };
}

const supportedChannelTypes = new Set<number>([
  0,
  1,
  2,
  3,
  4,
  5,
  10,
  11,
  12,
  13,
  14,
  15,
  16,
] satisfies ChannelType[]);

export function isDisplayChannelType(type: number): type is ChannelType {
  return supportedChannelTypes.has(type);
}

/** Convert a named channel identity. Unnamed or unsupported channels return undefined. */
export function fromDiscordChannel(channel: APIPartialChannel): ChannelEntityView | undefined {
  if (channel.name && isDisplayChannelType(channel.type))
    return { id: channel.id, name: channel.name, channelType: channel.type };
  return undefined;
}

export function emojiView(emoji: { name?: string | null; id?: string | null; animated?: boolean }): { name: string; image?: string } | undefined {
  if (emoji.id) {
    const format = emoji.animated ? ImageFormat.GIF : ImageFormat.WebP;
    return { name: emoji.name || "emoji", image: RouteBases.cdn + CDNRoutes.emoji(emoji.id, format) };
  }
  return emoji.name
    ? { name: emoji.name }
    : undefined;
}
