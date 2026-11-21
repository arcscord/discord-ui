import type { APIAttachment, APIMessage, APIMessageTopLevelComponent } from "discord-api-types/v10";
import type { MediaView, MessageContentView, MessageMediaView, StickerView, VideoView } from "../src/index";
import { Buffer } from "node:buffer";
import { ComponentType, MessageFlags, MessageType, StickerFormatType } from "discord-api-types/v10";
import { describe, expect, expectTypeOf, it } from "vitest";
import { fromDiscordMessage, fromDiscordMessageComponents } from "../src/discord-api";
import { decodeWaveform, formatMediaTime, mediaProgressBackground } from "../src/index";

const message: APIMessage = {
  id: "100",
  channel_id: "101",
  type: MessageType.Default,
  author: {
    id: "102",
    username: "media-user",
    global_name: null,
    discriminator: "0",
    avatar: null,
  },
  content: "",
  timestamp: "2026-11-20T12:00:00Z",
  edited_timestamp: null,
  tts: false,
  mention_everyone: false,
  mentions: [],
  mention_roles: [],
  attachments: [],
  embeds: [],
  pinned: false,
};

function attachment(id: string, filename: string, metadata: Partial<APIAttachment> = {}): APIAttachment {
  return {
    id,
    filename,
    url: `https://cdn.discordapp.com/attachments/101/${id}/${filename}?signed=example`,
    proxy_url: `https://media.discordapp.net/attachments/101/${id}/${filename}`,
    size: 1200,
    ...metadata,
  };
}

describe("media attachment conversion", () => {
  it("classifies MIME before filename extensions and preserves generic files", () => {
    const source = {
      ...message,
      attachments: [
        attachment("1", "recording.mp3", {
          content_type: "video/mp4",
          width: 640,
          height: 360,
          description: "A clip",
          duration_secs: 2.5,
        }),
        attachment("2", "film.mp4", { content_type: "audio/ogg", duration_secs: 4.25 }),
        attachment("3", "report.mp4", { content_type: "application/octet-stream" }),
        attachment("4", "image.mp4", { content_type: "image/png" }),
      ],
    };
    const original = structuredClone(source);
    const view = fromDiscordMessage(source);
    expect(view.media).toMatchObject([
      {
        id: "1",
        kind: "video",
        alt: "A clip",
        width: 640,
        height: 360,
        durationSeconds: 2.5,
      },
      { id: "4", alt: "image.mp4" },
    ]);
    expect(view.attachments).toMatchObject([
      {
        id: "2",
        kind: "audio",
        name: "film.mp4",
        size: "1200 B",
        durationSeconds: 4.25,
      },
      { id: "3", kind: "file", name: "report.mp4" },
    ]);
    expect(view.attachments?.[0]).not.toHaveProperty("voice");
    expect(view.media?.[1]).not.toHaveProperty("kind");
    expect(source).toEqual(original);
    expect(JSON.parse(JSON.stringify(view))).toEqual(view);
  });

  it("uses extensions only when MIME is missing and preserves spoilers", () => {
    const view = fromDiscordMessage({
      ...message,
      attachments: [
        attachment("1", "SPOILER_clip.WEBM"),
        attachment("2", "SPOILER_song.MP3"),
        attachment("3", "recording", { content_type: "audio/ogg" }),
        attachment("4", "unknown.bin"),
      ],
    });
    expect(view.media).toMatchObject([
      { id: "1", kind: "video", spoiler: true },
    ]);
    expect(view.attachments).toMatchObject([
      { id: "2", kind: "audio", spoiler: true },
      { id: "3", kind: "audio" },
      { id: "4", kind: "file" },
    ]);
  });

  it("uses the message voice flag rather than waveform metadata to identify a vocal", () => {
    const recording = attachment("1", "voice.ogg", { content_type: "audio/ogg", duration_secs: 3.5, waveform: "AID/" });
    const regular = fromDiscordMessage({
      ...message,
      attachments: [recording],
    }).attachments?.[0];
    expect(regular).toMatchObject({ kind: "audio", durationSeconds: 3.5 });
    expect(regular).not.toHaveProperty("voice");
    expect(regular).not.toHaveProperty("waveform");
    const vocal = fromDiscordMessage({
      ...message,
      flags: MessageFlags.IsVoiceMessage,
      attachments: [recording],
    }).attachments?.[0];
    expect(vocal).toMatchObject({
      kind: "audio",
      voice: true,
      waveform: [0, 128 / 255, 1],
    });
    const noMetadata = fromDiscordMessage({
      ...message,
      flags: MessageFlags.IsVoiceMessage,
      attachments: [
        attachment("2", "voice.ogg"),
      ],
    }).attachments?.[0];
    expect(noMetadata).toMatchObject({ kind: "audio", voice: true });
    expect(noMetadata).not.toHaveProperty("durationSeconds");
    expect(noMetadata).not.toHaveProperty("waveform");
  });

  it.each([-1, Number.NaN, Number.POSITIVE_INFINITY])("discards invalid audio and video duration %s", (duration_secs) => {
    const view = fromDiscordMessage({
      ...message,
      attachments: [
        attachment("1", "audio.ogg", { duration_secs }),
        attachment("2", "video.webm", { duration_secs }),
      ],
    });
    expect(view.attachments?.[0]).not.toHaveProperty("durationSeconds");
    expect(view.media?.[0]).not.toHaveProperty("durationSeconds");
  });

  it("keeps a valid proxy fallback and drops executable attachment URLs", () => {
    const view = fromDiscordMessage({
      ...message,
      attachments: [
        attachment("1", "audio.ogg", { url: "javascript:alert(1)", proxy_url: "https://example.com/audio.ogg" }),
        attachment("2", "video.webm", { url: "javascript:alert(1)", proxy_url: "data:text/html,bad" }),
      ],
    });
    expect(view.attachments?.[0]).toMatchObject({ kind: "audio", url: "https://example.com/audio.ogg" });
    expect(view.media).toBeUndefined();
  });
});

describe("voice waveform decoding and duration formatting", () => {
  it("decodes padded and unpadded samples within the normalized range", () => {
    expect(decodeWaveform("AP8=")).toEqual([0, 1]);
    expect(decodeWaveform("AP8")).toEqual([0, 1]);
    const encoded = Buffer.from(Array.from({ length: 256 }, (_, index) => index)).toString("base64");
    const decoded = decodeWaveform(encoded);
    expect(decoded).toHaveLength(256);
    expect(decoded?.every(value => value >= 0 && value <= 1)).toBe(true);
  });

  it.each([
    undefined,
    "",
    "bad!",
    "AA===",
    "A",
    "AA=",
    "AAA==",
    "=AAA",
    "AAAA\n",
    Buffer.alloc(257).toString("base64"),
  ])("discards malformed or oversized waveform %s", (waveform) => {
    expect(decodeWaveform(waveform)).toBeUndefined();
    const view = fromDiscordMessage({
      ...message,
      flags: MessageFlags.IsVoiceMessage,
      attachments: [
        attachment("1", "voice.ogg", waveform === undefined
          ? {}
          : { waveform }),
      ],
    });
    expect(view.attachments?.[0]).toMatchObject({ kind: "audio", voice: true });
    expect(view.attachments?.[0]).not.toHaveProperty("waveform");
  });

  it("formats durations deterministically including invalid values", () => {
    expect(formatMediaTime(65.9)).toBe("1:05");
    expect(formatMediaTime(0)).toBe("0:00");
    expect(formatMediaTime(-10)).toBe("0:00");
    expect(formatMediaTime(Number.NaN)).toBe("0:00");
  });
});

describe("sticker conversion", () => {
  it("converts every supported format to its correct delivery URL", () => {
    const view = fromDiscordMessage({
      ...message,
      sticker_items: [
        { id: "1", name: "Static", format_type: StickerFormatType.PNG },
        { id: "2", name: "Animated PNG", format_type: StickerFormatType.APNG },
        { id: "3", name: "Animated GIF", format_type: StickerFormatType.GIF },
        { id: "4", name: "Lottie", format_type: StickerFormatType.Lottie },
      ],
    });
    expect(view.stickers).toEqual([
      {
        id: "1",
        name: "Static",
        format: "png",
        url: "https://cdn.discordapp.com/stickers/1.png",
      },
      {
        id: "2",
        name: "Animated PNG",
        format: "apng",
        url: "https://cdn.discordapp.com/stickers/2.png",
      },
      {
        id: "3",
        name: "Animated GIF",
        format: "gif",
        url: "https://media.discordapp.net/stickers/3.gif",
      },
      {
        id: "4",
        name: "Lottie",
        format: "lottie",
        url: "https://cdn.discordapp.com/stickers/4.json",
      },
    ]);
    expect(fromDiscordMessage(message)).not.toHaveProperty("stickers");
  });
});

describe("components V2 video galleries", () => {
  it("converts direct and attachment references with dimensions, descriptions and spoilers", () => {
    const upload = attachment("200", "SPOILER_upload.webm", {
      content_type: "video/webm",
      width: 640,
      height: 360,
      duration_secs: 8,
      description: "Attachment description",
    });
    const nodes: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.MediaGallery,
        items: [
          {
            media: {
              url: "https://example.com/video.mp4",
              content_type: "video/mp4",
              width: 320,
              height: 180,
            },
            description: "Direct clip",
            spoiler: true,
          },
          {
            media: { url: `attachment://${upload.filename}` },
            description: "Gallery description",
          },
          {
            media: { url: "attachment://other-name", attachment_id: upload.id, width: 800 },
          },
          {
            media: { url: "https://example.com/fallback.webm?download=1" },
          },
          {
            media: { url: "https://example.com/image.png", content_type: "image/png" },
          },
        ],
      },
    ];
    expect(fromDiscordMessageComponents(nodes, {
      attachments: [upload],
    })).toMatchObject([
      {
        kind: "media-gallery",
        items: [
          {
            kind: "video",
            url: "https://example.com/video.mp4",
            alt: "Direct clip",
            width: 320,
            height: 180,
            spoiler: true,
          },
          {
            kind: "video",
            url: upload.url,
            alt: "Gallery description",
            width: 640,
            height: 360,
            durationSeconds: 8,
            spoiler: true,
          },
          {
            kind: "video",
            url: upload.url,
            alt: "Attachment description",
            width: 800,
            height: 360,
            spoiler: true,
          },
          { kind: "video", url: "https://example.com/fallback.webm?download=1" },
          { url: "https://example.com/image.png" },
        ],
      },
    ]);
    const view = fromDiscordMessage({
      ...message,
      flags: MessageFlags.IsComponentsV2,
      attachments: [upload],
      components: nodes,
    });
    expect(view.body.kind).toBe("components-v2");
    expect(view).not.toHaveProperty("media");
    expect(view).not.toHaveProperty("attachments");
    expect(view).not.toHaveProperty("stickers");
  });

  it("keeps thumbnails image-only instead of promoting videos to thumbnail players", () => {
    const nodes: APIMessageTopLevelComponent[] = [
      {
        type: ComponentType.Section,
        components: [
          { type: ComponentType.TextDisplay, content: "Preview" },
        ],
        accessory: {
          type: ComponentType.Thumbnail,
          media: { url: "https://example.com/video.mp4", content_type: "video/mp4" },
        },
      },
    ];
    expect(fromDiscordMessageComponents(nodes)).toEqual([]);
  });
});

it("preserves the old image contract and classic versus V2 media constraints", () => {
  const image = { id: "image", url: "/image.png", alt: "Image" } satisfies MediaView;
  const video = {
    id: "video",
    kind: "video",
    url: "/video.webm",
    alt: "Video",
  } satisfies VideoView;
  const sticker = {
    id: "sticker",
    name: "Sticker",
    format: "png",
    url: "/sticker.png",
  } satisfies StickerView;
  const classic = {
    body: { kind: "text", content: "" },
    media: [image, video],
    stickers: [sticker],
  } satisfies MessageContentView;
  expectTypeOf(image).toExtend<MessageMediaView>();
  expectTypeOf(video).toExtend<MessageMediaView>();
  expectTypeOf(classic).toExtend<MessageContentView>();
  // @ts-expect-error Stickers belong to classic messages.
  const invalidStickers: MessageContentView = {
    body: { kind: "components-v2", components: [] },
    stickers: [sticker],
  };
  // @ts-expect-error Top-level media belongs to classic messages.
  const invalidMedia: MessageContentView = {
    body: { kind: "components-v2", components: [] },
    media: [video],
  };
  const invalidImage: MediaView = {
    id: "image",
    url: "/image.png",
    alt: "Image",
    // @ts-expect-error MediaView images preserve their existing shape without a discriminator.
    kind: "video",
  };
  expect([invalidStickers, invalidMedia, invalidImage]).toHaveLength(3);
});

it("aligns progress fill with the seek thumb across boundaries", () => {
  expect(mediaProgressBackground(0, 10)).toBe("calc(0% + 5px) 100%");
  expect(mediaProgressBackground(4, 10)).toBe("calc(40% + 1px) 100%");
  expect(mediaProgressBackground(10, 10)).toBe("calc(100% + -5px) 100%");
  expect(mediaProgressBackground(20, 10)).toBe(mediaProgressBackground(10, 10));
  expect(mediaProgressBackground(-5, 10)).toBe(mediaProgressBackground(0, 10));
  expect(mediaProgressBackground(Number.NaN, 0)).toBe(mediaProgressBackground(0, 10));
});
