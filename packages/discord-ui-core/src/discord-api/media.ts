import type { APIAttachment } from "discord-api-types/v10";
import type { FileView } from "../model/components";
import type { MediaView } from "../model/content";
import { linkUrl } from "../utils/urls";

type DiscordMedia = {
  url: string;
  proxy_url?: string;
  attachment_id?: string;
  content_type?: string | null;
  width?: number | null;
  height?: number | null;
};

const attachmentPrefix = "attachment://";

export function resolveMedia(source: DiscordMedia, attachments: readonly APIAttachment[]): { url: string | undefined; attachment: APIAttachment | undefined; filename: string | undefined } {
  const filename = source.url.startsWith(attachmentPrefix)
    ? source.url.slice(attachmentPrefix.length)
    : undefined;
  const attachment = (source.attachment_id && attachments.find(item => item.id === source.attachment_id))
    || (filename && attachments.find(item => item.filename === filename || item.title === filename))
    || undefined;
  const url = linkUrl(attachment?.url) ?? linkUrl(source.url) ?? linkUrl(source.proxy_url) ?? linkUrl(attachment?.proxy_url);
  return { url, attachment, filename };
}

export function isImageAttachment(attachment: APIAttachment): boolean {
  return attachment.content_type === undefined
    ? /\.(?:avif|gif|jpe?g|png|webp|svg|bmp|ico)$/iu.test(attachment.filename)
    : attachment.content_type.startsWith("image/");
}

export function mediaView(id: string, source: DiscordMedia, attachments: readonly APIAttachment[], alt?: string | null, spoiler?: boolean): MediaView | undefined {
  const { url, attachment, filename } = resolveMedia(source, attachments);
  const contentType = source.content_type ?? attachment?.content_type;
  if (!url || (contentType && !contentType.startsWith("image/")))
    return undefined;
  const width = source.width ?? attachment?.width;
  const height = source.height ?? attachment?.height;
  return {
    id,
    url,
    alt: alt ?? attachment?.description ?? attachment?.filename ?? filename ?? "",
    ...(width != null
      ? { width }
      : {}),
    ...(height != null
      ? { height }
      : {}),
    ...((spoiler || attachment?.filename.startsWith("SPOILER_") || filename?.startsWith("SPOILER_"))
      ? { spoiler: true }
      : {}),
  };
}

export function fileView(id: string, url: string, name: string, size: number | undefined, spoiler?: boolean): FileView {
  return {
    id,
    kind: "file",
    name,
    url,
    ...(size !== undefined
      ? { size: `${size} B` }
      : {}),
    ...(spoiler || name.startsWith("SPOILER_")
      ? { spoiler: true }
      : {}),
  };
}
