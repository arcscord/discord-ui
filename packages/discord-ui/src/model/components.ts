import type { MediaView } from "./content";

export type TextDisplayView = { id: string; kind: "text-display"; content: string };
export type LinkButtonView = { id: string; kind: "link-button"; label: string; url: string; disabled?: boolean; emoji?: { name: string; image?: string } };
export type ThumbnailView = { id: string; kind: "thumbnail"; media: MediaView };
export type SectionView = { id: string; kind: "section"; components: TextDisplayView[]; accessory: ThumbnailView | LinkButtonView };
export type GalleryView = { id: string; kind: "media-gallery"; items: MediaView[] };
export type SeparatorView = { id: string; kind: "separator"; divider?: boolean; spacing?: "small" | "large" };
export type ActionRowView = { id: string; kind: "action-row"; buttons: LinkButtonView[] };
export type ContainerChild = TextDisplayView | SectionView | GalleryView | SeparatorView | ActionRowView;
export type ContainerView = { id: string; kind: "container"; accentColor?: string; spoiler?: boolean; components: ContainerChild[] };
export type MessageComponent = ContainerChild | ContainerView;
export type ComponentsV2Body = { kind: "components-v2"; components: MessageComponent[] };
