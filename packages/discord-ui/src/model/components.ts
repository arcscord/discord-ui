import type { MediaView } from "./content";
import type { ChannelEntityView, ChannelType, RoleView, UserView } from "./entities";

export type TextDisplayView = { id: string; kind: "text-display"; content: string };
export type LinkButtonView = { id: string; kind: "link-button"; label: string; url: string; disabled?: boolean; emoji?: { name: string; image?: string } };
export type ButtonView = { id: string; kind: "button"; label: string; style?: "primary" | "secondary" | "success" | "danger"; disabled?: boolean; emoji?: { name: string; image?: string } };
/** Premium product details are supplied by the host application, without API calls. */
export type PremiumButtonView = { id: string; kind: "premium-button"; skuId: string; label: string; disabled?: boolean };
export type MessageButtonView = LinkButtonView | ButtonView | PremiumButtonView;
type SelectValue = { value: string; label: string };
type NoStringFields = { description?: never; emoji?: never; default?: never };
type NoUserFields = { avatarUrl?: never; username?: never; status?: never; bot?: never; verified?: never };
type NoChannelFields = { channelType?: never; locked?: never; rules?: never };
export type StringSelectOptionView = SelectValue & NoUserFields & NoChannelFields & {
  description?: string;
  emoji?: { name: string; image?: string };
  default?: boolean;
  entityType?: never;
  color?: never;
};
/** Resolved display data, not configurable Discord string options. */
export type UserSelectOptionView = UserView & NoStringFields & NoChannelFields & { entityType: "user"; color?: never };
export type RoleSelectOptionView = RoleView & NoStringFields & NoUserFields & NoChannelFields & { entityType: "role" };
/** Discord channel type IDs, including threads, forums and media channels. */
export type SelectChannelType = ChannelType;
export type ChannelSelectOptionView = ChannelEntityView & NoStringFields & NoUserFields & { entityType: "channel"; color?: never };
export type SelectOptionView = StringSelectOptionView | UserSelectOptionView | RoleSelectOptionView | ChannelSelectOptionView;
type SelectMenuBase = {
  id: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  disabled?: boolean;
};
export type SelectDefaultValue<Type extends "user" | "role" | "channel"> = { id: string; type: Type };
export type StringSelectMenuView = SelectMenuBase & {
  kind: "string-select";
  options: readonly StringSelectOptionView[];
  entities?: never;
  defaultValues?: never;
  channelTypes?: never;
};
export type UserSelectMenuView = SelectMenuBase & {
  kind: "user-select";
  entities: readonly UserSelectOptionView[];
  defaultValues?: readonly SelectDefaultValue<"user">[];
  options?: never;
  channelTypes?: never;
};
export type RoleSelectMenuView = SelectMenuBase & {
  kind: "role-select";
  entities: readonly RoleSelectOptionView[];
  defaultValues?: readonly SelectDefaultValue<"role">[];
  options?: never;
  channelTypes?: never;
};
export type MentionableSelectMenuView = SelectMenuBase & {
  kind: "mentionable-select";
  entities: readonly (UserSelectOptionView | RoleSelectOptionView)[];
  defaultValues?: readonly SelectDefaultValue<"user" | "role">[];
  options?: never;
  channelTypes?: never;
};
export type ChannelSelectMenuView = SelectMenuBase & {
  kind: "channel-select";
  entities: readonly ChannelSelectOptionView[];
  defaultValues?: readonly SelectDefaultValue<"channel">[];
  channelTypes?: readonly SelectChannelType[];
  options?: never;
};
/** Entity menus receive resolved server data from the host; no Discord API calls. */
export type SelectMenuView = StringSelectMenuView | UserSelectMenuView | RoleSelectMenuView | MentionableSelectMenuView | ChannelSelectMenuView;
export type FileView = { id: string; kind: "file"; name: string; url: string; size?: string; spoiler?: boolean };
/** Identifies the source even when component IDs are reused across messages. */
export type ComponentInteractionContext = {
  componentId: string;
  /** Present when rendered through Message, MessageList, ChannelView or ThreadPanel. */
  messageId?: string;
};
/** Controlled values keyed by select ID within a single message. Missing keys use local state. */
export type SelectValues = Readonly<Record<string, readonly string[] | undefined>>;
/** Message IDs scope selections when component IDs are reused across conversations. */
export type SelectValuesByMessage = Readonly<Record<string, SelectValues | undefined>>;
export type ComponentHandlers = {
  onButtonClick?: ((id: string, context: ComponentInteractionContext) => void) | undefined;
  onSelectChange?: ((id: string, values: string[], context: ComponentInteractionContext) => void) | undefined;
  onPremiumClick?: ((skuId: string, context: ComponentInteractionContext) => void) | undefined;
};
export type ThumbnailView = { id: string; kind: "thumbnail"; media: MediaView };
export type SectionView = { id: string; kind: "section"; components: readonly TextDisplayView[]; accessory: ThumbnailView | MessageButtonView };
export type GalleryView = { id: string; kind: "media-gallery"; items: readonly MediaView[] };
export type SeparatorView = { id: string; kind: "separator"; divider?: boolean; spacing?: "small" | "large" };
export type ActionRowView = { id: string; kind: "action-row" } & (
  | { buttons: readonly MessageButtonView[]; select?: never }
  | { select: SelectMenuView; buttons?: never }
);
export type ContainerChild = TextDisplayView | SectionView | GalleryView | SeparatorView | ActionRowView | FileView;
export type ContainerView = { id: string; kind: "container"; accentColor?: string; spoiler?: boolean; components: readonly ContainerChild[] };
export type MessageComponent = ContainerChild | ContainerView;
export type ComponentsV2Body = { kind: "components-v2"; components: readonly MessageComponent[] };
