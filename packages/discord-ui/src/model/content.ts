export type EntityView = { name: string; color?: string };
export type MessageEntities = {
  users?: Record<string, EntityView>;
  channels?: Record<string, EntityView>;
  roles?: Record<string, EntityView>;
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
export type EmbedView = {
  id: string;
  title?: string;
  url?: string;
  description?: string;
  color?: string;
  author?: { name: string; url?: string; iconUrl?: string };
  thumbnail?: MediaView;
  image?: MediaView;
  fields?: { id: string; name: string; value: string; inline?: boolean }[];
  footer?: { text: string; iconUrl?: string };
  timestamp?: string;
};
export type MarkdownMessageBody = { kind: "markdown"; content: string };
