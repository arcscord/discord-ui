import type { AudioView, MessageView, StickerView, VideoView } from "@arcscord/discord-ui-core";
import { renderToString } from "@vue/server-renderer";
import { describe, expect, it } from "vitest";
import { createSSRApp, h } from "vue";
import { Audio, DiscordUI, MediaGallery, Message, Sticker, Video } from "../src/index";

const video: VideoView = {
  id: "video",
  kind: "video",
  url: "/examples/trail.webm",
  alt: "Trail",
  width: 320,
  height: 180,
  durationSeconds: 12,
};
const audio: AudioView = {
  id: "audio",
  kind: "audio",
  url: "/examples/voice.wav",
  name: "Voice message",
  voice: true,
  durationSeconds: 3,
  waveform: [0, 0.5, 1],
};
const sticker: StickerView = {
  id: "sticker",
  name: "Wave",
  format: "png",
  url: "/examples/wave.png",
};

async function render(component: Parameters<typeof h>[0], props: Record<string, unknown>, options: Record<string, unknown> = {}) {
  return renderToString(createSSRApp({
    render: () => h(DiscordUI, options, {
      default: () => h(component, props),
    }),
  }));
}

describe("native media SSR", () => {
  it("renders mixed galleries, audio controls and deterministic duration with deterministic initial loading", async () => {
    const gallery = await render(MediaGallery, {
      items: [
        video,
        { id: "image", url: "/examples/chart.png", alt: "Chart" },
      ],
    });
    expect(gallery).toContain("<video");
    expect(gallery).toContain("preload=\"metadata\"");
    expect(gallery).toContain("alt=\"Chart\"");
    expect(gallery).not.toContain("autoplay");
    const vocal = await render(Audio, { audio });
    expect(vocal).toContain("<audio");
    expect(vocal).toContain("preload=\"none\"");
    expect(vocal).toContain("dui-player-voice");
    expect(vocal).toContain("dui-waveform-bar");
    expect(vocal).toContain("0:00 / 0:03");
    expect(vocal).toContain("1×");
    expect(vocal).toBe(await render(Audio, { audio }));
    expect(await render(Audio, {
      audio: { ...audio, waveform: undefined },
    })).not.toContain("dui-waveform-bar");
  });

  it("keeps concealed audio and video unmounted", async () => {
    expect(await render(Video, {
      video: { ...video, spoiler: true },
    })).not.toContain("<video");
    expect(await render(Audio, {
      audio: { ...audio, spoiler: true },
    })).not.toContain("<audio");
  });

  it("blocks remote sources, posters and sticker sources with an accessible fallback", async () => {
    const source = "https://example.com/private.webm";
    const blockedVideo = await render(Video, {
      video: { ...video, url: source, posterUrl: "https://example.com/private.png" },
    }, { allowRemoteMedia: false });
    expect(blockedVideo).not.toContain(source);
    expect(blockedVideo).not.toContain("<video");
    expect(blockedVideo).toContain("Media unavailable");
    const blockedPoster = await render(Video, {
      video: { ...video, posterUrl: source },
    }, { allowRemoteMedia: false });
    expect(blockedPoster).toContain("<video");
    expect(blockedPoster).not.toContain("poster=");
    const blockedAudio = await render(Audio, {
      audio: { ...audio, url: source },
    }, { allowRemoteMedia: false });
    expect(blockedAudio).not.toContain("<audio");
    const blockedSticker = await render(Sticker, {
      sticker: { ...sticker, url: source },
    }, { allowRemoteMedia: false });
    expect(blockedSticker).not.toContain("<img");
    expect(blockedSticker).toContain("Wave");
  });

  it("renders supported stickers and localizes the unsupported Lottie state", async () => {
    for (const format of ["png", "apng", "gif"] as const) {
      const html = await render(Sticker, {
        sticker: { ...sticker, format },
      });
      expect(html).toContain("alt=\"Wave\"");
      expect(html).toContain("dui-sticker");
    }
    const unsupported = await render(Sticker, {
      sticker: { ...sticker, format: "lottie", url: "https://example.com/animation.json" },
    }, {
      labels: { mediaUnsupportedSticker: "Unsupported animation" },
    });
    expect(unsupported).toContain("Unsupported animation: Wave");
    expect(unsupported).not.toContain("https://example.com/animation.json");
    expect(unsupported).not.toContain("<img");
  });

  it("integrates the new contracts through classic messages", async () => {
    const message: MessageView = {
      id: "media-message",
      timestamp: "2026-11-20T12:00:00Z",
      author: { id: "author", displayName: "Author" },
      body: { kind: "text", content: "Media" },
      media: [video],
      attachments: [audio],
      stickers: [sticker],
    };
    const html = await render(Message, { message });
    expect(html).toContain("<video");
    expect(html).toContain("<audio");
    expect(html).toContain("dui-sticker");
  });
});
