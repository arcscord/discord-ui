import type { EntityView, RoleView } from "./entities";

export type { EntityView } from "./entities";
export type MessageEntities = {
  users?: Record<string, EntityView>;
  channels?: Record<string, EntityView>;
  roles?: Record<string, Omit<RoleView, "id">>;
  emojis?: Record<string, { name: string; image: string }>;
  commands?: Record<string, EntityView>;
};
export type MediaView = {
  id: string;
  url: string;
  alt: string;
  spoiler?: boolean;
  width?: number;
  height?: number;
};
/** A directly playable video source, supplied by the host. */
export type VideoView = {
  kind: "video";
  id: string;
  url: string;
  alt: string;
  spoiler?: boolean;
  width?: number;
  height?: number;
  posterUrl?: string;
  durationSeconds?: number;
};
export type MessageMediaView = MediaView | VideoView;
export type AudioView = {
  kind: "audio";
  id: string;
  url: string;
  name: string;
  size?: string;
  spoiler?: boolean;
  durationSeconds?: number;
  voice?: boolean;
  /** Normalized amplitude samples between zero and one. */
  waveform?: readonly number[];
};
export type StickerView = {
  id: string;
  name: string;
  format: "png" | "apng" | "gif" | "lottie";
  url: string;
};
export type EmbedView = {
  id: string;
  title?: string;
  url?: string;
  description?: string;
  color?: string;
  author?: { name: string; url?: string; iconUrl?: string };
  thumbnail?: MediaView;
  image?: MediaView;
  fields?: readonly { id: string; name: string; value: string; inline?: boolean }[];
  footer?: { text: string; iconUrl?: string };
  timestamp?: string;
};
export type MarkdownMessageBody = { kind: "markdown"; content: string };
