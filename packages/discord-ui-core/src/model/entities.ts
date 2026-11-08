import type { ChannelViewModel } from "./channel";
import type { MessageAuthor } from "./message";

export type EntityView = { name: string; color?: string };
/** A reusable resolved Discord role, for selectors, mentions and member lists. */
export type RoleView = EntityView & { id: string };
/** Reuse the same identity/avatar/app fields as message authors. */
export type UserView = Pick<MessageAuthor, "id" | "displayName" | "avatarUrl" | "bot" | "verified"> & {
  username?: string;
  status?: "online" | "idle" | "dnd" | "offline";
};
export type ChannelType = 0 | 1 | 2 | 3 | 4 | 5 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
/** Channel identity with the metadata needed for Discord's channel icons. */
export type ChannelEntityView = Pick<ChannelViewModel, "id" | "name"> & {
  channelType: ChannelType;
  locked?: boolean;
  rules?: boolean;
};
