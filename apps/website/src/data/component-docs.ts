/** Shared destinations for guides, the API reference and every catalogue variant. */
export const componentDocs = {
  DiscordUI: ["display-components", "themes"],
  Author: ["display-components", "messages"],
  Avatar: ["display-components", "messages"],
  Message: ["display-components", "messages"],
  MessageFrame: ["display-components", "messages"],
  MessageHeader: ["display-components", "messages"],
  MessageContent: ["display-components", "messages"],
  MessageTimestamp: ["display-components", "localization"],
  ReplyPreview: ["display-components", "messages"],
  Markdown: ["display-components", "markdown"],
  Mention: ["display-components", "markdown"],
  Emoji: ["display-components", "markdown"],
  Embed: ["display-components", "embeds"],
  Media: ["display-components", "media"],
  MediaGallery: ["display-components", "media"],
  MessageComponents: ["interactive-components", "components-v2"],
  ActionRow: ["interactive-components", "components-v2"],
  Button: ["interactive-components", "interactions"],
  LinkButton: ["interactive-components", "interactions"],
  Container: ["interactive-components", "components-v2"],
  File: ["interactive-components", "media"],
  Section: ["interactive-components", "components-v2"],
  Separator: ["interactive-components", "components-v2"],
  TextDisplay: ["interactive-components", "components-v2"],
  Thumbnail: ["interactive-components", "components-v2"],
  SelectMenu: ["interactive-components", "interactions"],
  Spoiler: ["interactive-components", "markdown"],
  Reactions: ["interactive-components", "reactions"],
  ChannelView: ["conversation-components", "channels"],
  ChannelHeader: ["conversation-components", "channels"],
  ChannelComposer: ["conversation-components", "composer"],
  MessageList: ["conversation-components", "channels"],
  ThreadPanel: ["conversation-components", "threads"],
  ThreadPreview: ["conversation-components", "threads"],
} as const;

export function documentationLinks(component: string): { guide: string; reference: string } {
  const destination = componentDocs[component as keyof typeof componentDocs];
  if (!destination)
    throw new Error(`Missing documentation destination for ${component}`);
  return {
    guide: `/docs/guides/${destination[1]}`,
    reference: `/docs/api/${destination[0]}#${component.toLowerCase()}`,
  };
}
