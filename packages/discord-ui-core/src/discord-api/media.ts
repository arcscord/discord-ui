import type { APIAttachment } from "discord-api-types/v10";
import type { FileView } from "../model/components";
import type { AudioView, MediaView, MessageMediaView, VideoView } from "../model/content";
import { decodeWaveform } from "../utils/media";
import { linkUrl } from "../utils/urls";

type DiscordMedia = {
  url: string;
  proxy_url?: string;
  attachment_id?: string;
  content_type?: string | null;
  width?: number | null;
  height?: number | null;
  duration_secs?: number;
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

export function attachmentKind(source: { content_type?: string | null; filename?: string; url?: string }): "image" | "video" | "audio" | "file" {
  const mime = source.content_type?.split(";", 1)[0]?.trim().toLowerCase();
  if (mime) {
    return mime.startsWith("image/")
      ? "image"
      : mime.startsWith("video/")
        ? "video"
        : mime.startsWith("audio/")
          ? "audio"
          : "file";
  }
  const name = source.filename ?? source.url?.split(/[?#]/u, 1)[0] ?? "";
  if (/\.(?:avif|gif|jpe?g|png|webp|svg|bmp|ico)$/iu.test(name))
    return "image";
  if (/\.(?:mp4|m4v|webm|mov|ogv)$/iu.test(name))
    return "video";
  if (/\.(?:mp3|m4a|aac|ogg|oga|opus|wav|flac|weba)$/iu.test(name))
    return "audio";
  return "file";
}

export function mediaView(id: string, source: DiscordMedia, attachments: readonly APIAttachment[], alt?: string | null, spoiler?: boolean): MediaView | undefined {
  const { url, attachment, filename } = resolveMedia(source, attachments);
  const contentType = source.content_type ?? attachment?.content_type;
  const kind = attachmentKind({ content_type: contentType ?? null, filename: attachment?.filename ?? filename ?? source.url.split(/[?#]/u, 1)[0] ?? "" });
  if (!url || (contentType && !contentType.toLowerCase().startsWith("image/")) || kind === "video" || kind === "audio")
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

export function galleryMediaView(id: string, source: DiscordMedia, attachments: readonly APIAttachment[], alt?: string | null, spoiler?: boolean): MessageMediaView | undefined {
  const { attachment, url, filename } = resolveMedia(source, attachments);
  const kind = attachmentKind({ ...source, content_type: source.content_type ?? attachment?.content_type ?? null, filename: attachment?.filename ?? filename ?? source.url.split(/[?#]/u, 1)[0] ?? "" });
  if (kind === "audio")
    return undefined;
  if (kind !== "video")
    return mediaView(id, source, attachments, alt, spoiler);
  if (!url)
    return undefined;
  const width = source.width ?? attachment?.width;
  const height = source.height ?? attachment?.height;
  const video: VideoView = {
    kind: "video",
    id,
    url,
    alt: alt ?? attachment?.description ?? attachment?.filename ?? "",
  };
  if (width != null)
    video.width = width;
  if (height != null)
    video.height = height;
  if (spoiler || attachment?.filename.startsWith("SPOILER_") || filename?.startsWith("SPOILER_"))
    video.spoiler = true;
  const duration = source.duration_secs ?? attachment?.duration_secs;
  if (duration !== undefined && Number.isFinite(duration) && duration >= 0)
    video.durationSeconds = duration;
  return video;
}

export function audioView(attachment: APIAttachment, voice: boolean): AudioView | undefined {
  const url = linkUrl(attachment.url) ?? linkUrl(attachment.proxy_url);
  if (!url)
    return undefined;
  const audio: AudioView = {
    ...fileView(attachment.id, url, attachment.filename, attachment.size),
    kind: "audio",
  };
  if (voice)
    audio.voice = true;
  if (attachment.duration_secs !== undefined && Number.isFinite(attachment.duration_secs) && attachment.duration_secs >= 0)
    audio.durationSeconds = attachment.duration_secs;
  const waveform = voice && decodeWaveform(attachment.waveform);
  if (waveform)
    audio.waveform = waveform;
  return audio;
}
