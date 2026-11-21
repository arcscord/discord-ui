import type { APIAttachment, APIEmbed, APIMessage, APIUser, GatewayMessageCreateDispatchData } from "discord-api-types/v10";
import type { DiscordMessageConversionOptions } from "./discord-api/components";
import type { FileView } from "./model/components";
import type { AudioView, EmbedView, MessageMediaView, StickerView } from "./model/content";
import type { MessageAuthor, MessageMetadata, MessageView, ReplyView } from "./model/message";
import type { ThreadSummaryView } from "./model/thread";
import { ChannelType, ComponentType, MessageFlags, MessageType, StickerFormatType } from "discord-api-types/v10";
import { convertActionRow, fromDiscordMessageComponents } from "./discord-api/components";
import { discordUserIdentity, discordUserTag, emojiView, guildAvatarUrl, hexColor } from "./discord-api/entities";
import { attachmentKind, audioView, fileView, galleryMediaView, mediaView, resolveMedia } from "./discord-api/media";
import { linkUrl } from "./utils/urls";

export { fromDiscordMessageComponents } from "./discord-api/components";
export type { DiscordComponentConversionOptions, DiscordMessageConversionOptions } from "./discord-api/components";
export { fromDiscordChannel, fromDiscordRole, fromDiscordUser } from "./discord-api/entities";

type DiscordMessageInput = APIMessage & Pick<GatewayMessageCreateDispatchData, "guild_id" | "member">;

function userAuthor(user: APIUser): ReturnType<typeof discordUserIdentity> & Pick<MessageAuthor, "tag"> {
  const tag = discordUserTag(user);
  return {
    ...discordUserIdentity(user),
    ...(tag
      ? { tag }
      : {}),
  };
}

function messageAuthor(message: DiscordMessageInput): MessageAuthor {
  const author = userAuthor(message.author);
  const memberAvatar = message.member?.avatar;
  return {
    ...author,
    displayName: message.member?.nick || author.displayName,
    avatarUrl: message.guild_id && memberAvatar
      ? guildAvatarUrl(message.guild_id, author.id, memberAvatar)
      : author.avatarUrl,
  };
}

function messageReply(message: APIMessage): ReplyView | undefined {
  if (message.type === MessageType.Reply) {
    if (message.referenced_message) {
      return {
        messageId: message.referenced_message.id,
        author: messageAuthor(message.referenced_message),
        content: message.referenced_message.content,
      };
    }
    if (message.referenced_message === null && message.message_reference?.message_id)
      return { messageId: message.message_reference.message_id, unavailable: true };
  }
  if (message.type === MessageType.ChatInputCommand && message.interaction?.name) {
    return {
      kind: "interaction",
      author: userAuthor(message.interaction.user),
      commandName: message.interaction.name,
    };
  }
  return undefined;
}

function threadSummary(thread: APIMessage["thread"]): ThreadSummaryView | undefined {
  if (thread?.type === ChannelType.AnnouncementThread || thread?.type === ChannelType.PublicThread || thread?.type === ChannelType.PrivateThread) {
    if (thread.name && thread.message_count !== undefined)
      return { id: thread.id, name: thread.name, messageCount: thread.message_count };
  }
  return undefined;
}

function embedIcon(iconUrl: string | undefined, proxyUrl: string | undefined, attachments: readonly APIAttachment[]): string | undefined {
  return iconUrl === undefined
    ? linkUrl(proxyUrl)
    : resolveMedia({
      url: iconUrl,
      ...(proxyUrl
        ? { proxy_url: proxyUrl }
        : {}),
    }, attachments).url;
}

function convertEmbed(embed: APIEmbed, id: string, attachments: readonly APIAttachment[]): EmbedView {
  const { author, footer, title, url, description, color, timestamp } = embed;
  const thumbnail = embed.thumbnail && mediaView(`${id}:thumbnail`, embed.thumbnail, attachments);
  const image = embed.image && mediaView(`${id}:image`, embed.image, attachments);
  const view: EmbedView = { id };
  if (title !== undefined)
    view.title = title;
  if (url !== undefined)
    view.url = url;
  if (description !== undefined)
    view.description = description;
  if (color !== undefined)
    view.color = hexColor(color);
  if (timestamp !== undefined)
    view.timestamp = timestamp;
  if (thumbnail)
    view.thumbnail = thumbnail;
  if (image)
    view.image = image;
  if (author) {
    const iconUrl = embedIcon(author.icon_url, author.proxy_icon_url, attachments);
    view.author = { name: author.name };
    if (author.url !== undefined)
      view.author.url = author.url;
    if (iconUrl)
      view.author.iconUrl = iconUrl;
  }
  if (footer) {
    const iconUrl = embedIcon(footer.icon_url, footer.proxy_icon_url, attachments);
    view.footer = { text: footer.text };
    if (iconUrl)
      view.footer.iconUrl = iconUrl;
  }
  if (embed.fields)
    view.fields = embed.fields.map((field, index) => ({ ...field, id: `${id}:field:${index}` }));
  return view;
}

function attachmentUrlKey(url: string): string {
  // Discord's direct and resized URLs can have different hosts and query strings.
  return /^https:\/\/(?:cdn\.discordapp\.com|media\.discordapp\.net)(\/(?:ephemeral-)?attachments\/\d+\/\d+)\//u.exec(url)?.[1] ?? url;
}

/** Convert a complete REST message or Gateway MESSAGE_CREATE payload to a display snapshot. */
export function fromDiscordMessage(message: DiscordMessageInput, options: DiscordMessageConversionOptions = {}): MessageView {
  const flags = message.flags ?? 0;
  const reply = messageReply(message);
  const thread = threadSummary(message.thread);
  const reactions = message.reactions?.flatMap((reaction) => {
    const emoji = emojiView(reaction.emoji);
    return emoji
      ? [
          {
            id: reaction.emoji.id ?? emoji.name,
            emoji,
            count: reaction.count,
            me: reaction.me || reaction.me_burst === true,
          },
        ]
      : [];
  });
  const metadata: MessageMetadata & { thread?: ThreadSummaryView } = {
    id: message.id,
    author: messageAuthor(message),
    timestamp: message.timestamp,
    edited: message.edited_timestamp != null,
    ephemeral: Boolean(flags & MessageFlags.Ephemeral),
  };
  if (reactions)
    metadata.reactions = reactions;
  if (reply)
    metadata.reply = reply;
  if (thread)
    metadata.thread = thread;

  if (flags & MessageFlags.IsComponentsV2) {
    return {
      ...metadata,
      body: {
        kind: "components-v2",
        components: fromDiscordMessageComponents(message.components ?? [], { ...options, attachments: message.attachments }),
      },
    };
  }

  const embeds = flags & MessageFlags.SuppressEmbeds
    ? []
    : message.embeds.map((embed, index) => convertEmbed(embed, `embed:${index}`, message.attachments));
  const embeddedMedia = new Set(embeds.flatMap(embed => [
    embed.image?.url,
    embed.thumbnail?.url,
    embed.author?.iconUrl,
    embed.footer?.iconUrl,
  ]
    .filter(url => url !== undefined)
    .map(attachmentUrlKey)));
  const media: MessageMediaView[] = [];
  const files: (FileView | AudioView)[] = [];
  for (const attachment of message.attachments) {
    if (embeddedMedia.has(attachmentUrlKey(attachment.url)) || embeddedMedia.has(attachmentUrlKey(attachment.proxy_url)))
      continue;
    const kind = attachmentKind(attachment);
    if (kind === "image" || kind === "video") {
      const image = galleryMediaView(attachment.id, attachment, [attachment], attachment.description ?? attachment.filename, attachment.filename.startsWith("SPOILER_"));
      if (image)
        media.push(image);
    }
    else if (kind === "audio") {
      const audio = audioView(attachment, Boolean(flags & MessageFlags.IsVoiceMessage));
      if (audio)
        files.push(audio);
    }
    else {
      const url = linkUrl(attachment.url) ?? linkUrl(attachment.proxy_url);
      if (url)
        files.push(fileView(attachment.id, url, attachment.filename, attachment.size));
    }
  }
  const components = message.components?.flatMap((component, index) => {
    const row = component.type === ComponentType.ActionRow && convertActionRow(component, String(index), options);
    return row
      ? [row]
      : [];
  });
  const view: MessageView = {
    ...metadata,
    body: { kind: "markdown", content: message.content },
  };
  const stickers = message.sticker_items?.flatMap((sticker): StickerView[] => {
    const formats = {
      [StickerFormatType.PNG]: "png",
      [StickerFormatType.APNG]: "apng",
      [StickerFormatType.GIF]: "gif",
      [StickerFormatType.Lottie]: "lottie",
    } as const;
    const format = formats[sticker.format_type];
    if (!format)
      return [];
    const extension = format === "apng"
      ? "png"
      : format === "lottie"
        ? "json"
        : format;
    const origin = format === "gif"
      ? "https://media.discordapp.net"
      : "https://cdn.discordapp.com";
    return [
      {
        id: sticker.id,
        name: sticker.name,
        format,
        url: `${origin}/stickers/${encodeURIComponent(sticker.id)}.${extension}`,
      },
    ];
  });
  if (stickers?.length)
    view.stickers = stickers;
  if (media.length)
    view.media = media;
  if (files.length)
    view.attachments = files;
  if (embeds.length)
    view.embeds = embeds;
  if (components?.length)
    view.components = components;
  return view;
}
