import type { ComponentProps } from "react";
import type { AudioProps, AudioView, MediaProps, MediaView, MessageView, StickerProps, StickerView, VideoProps, VideoView } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import { Audio, DiscordUI, Media, MediaGallery, Message, Sticker, Video } from "../src/index";

const image: MediaView = { id: "image", url: "/examples/image.png", alt: "Landscape" };
const video: VideoView = {
  id: "video",
  kind: "video",
  url: "/examples/clip.mp4",
  alt: "A short clip",
  posterUrl: "/examples/poster.png",
  width: 320,
  height: 180,
  durationSeconds: 8,
};
const audio: AudioView = {
  id: "audio",
  kind: "audio",
  url: "/examples/music.wav",
  name: "music.wav",
  size: "12 KB",
  durationSeconds: 65.9,
};
const sticker: StickerView = {
  id: "sticker",
  name: "Hello sticker",
  format: "gif",
  url: "/examples/hello.gif",
};
const base: MessageView = {
  id: "message",
  author: { id: "author", displayName: "Author" },
  timestamp: "2026-11-20T10:00:00Z",
  body: { kind: "text", content: "Media message" },
};

describe("media public contracts", () => {
  it("exports typed native components and accepts existing image models", () => {
    expectTypeOf<ComponentProps<typeof Audio>>().toEqualTypeOf<AudioProps>();
    expectTypeOf<ComponentProps<typeof Video>>().toEqualTypeOf<VideoProps>();
    expectTypeOf<ComponentProps<typeof Sticker>>().toEqualTypeOf<StickerProps>();
    expectTypeOf<{ media: MediaView }>().toMatchTypeOf<MediaProps>();
    expectTypeOf<Extract<MessageView, { body: { kind: "components-v2" } }>["stickers"]>().toEqualTypeOf<undefined>();
    expectTypeOf<{
      id: string;
      author: MessageView["author"];
      timestamp: string;
      body: { kind: "components-v2"; components: [] };
      stickers: StickerView[];
    }>().not.toMatchTypeOf<MessageView>();
    const html = renderToStaticMarkup(<Media media={image} />);
    expect(html).toContain("src=\"/examples/image.png\"");
    expect(html).toContain("alt=\"Landscape\"");
    expect(html).not.toContain("<video");
  });
});

describe("media server rendering", () => {
  it("renders custom video and audio controls with deterministic initial state", () => {
    const content = (
      <>
        <Video video={video} />
        <Audio audio={audio} />
      </>
    );
    const html = renderToStaticMarkup(content);
    expect(html).toContain("<video src=\"/examples/clip.mp4\"");
    expect(html).toContain("poster=\"/examples/poster.png\"");
    expect(html).toContain("width=\"320\" height=\"180\"");
    expect(html).toContain("<audio src=\"/examples/music.wav\"");
    expect(html.match(/preload="none"/gu)).toHaveLength(2);
    const withoutPoster = renderToStaticMarkup(
      <Video video={{
        id: "no-poster",
        kind: "video",
        url: video.url,
        alt: video.alt,
      }}
      />,
    );
    expect(withoutPoster).toContain("preload=\"metadata\"");
    expect(html).not.toContain("autoplay");
    expect(html).not.toContain(" controls=");
    expect(html).toContain("aria-label=\"Play\"");
    expect(html).toContain("aria-label=\"Playback position\"");
    expect(html).toContain("aria-label=\"Volume\"");
    expect(html).toContain("aria-label=\"Mute\"");
    expect(html).toContain("aria-valuetext=\"0:00 / 1:05\"");
    expect(html).toContain("aria-label=\"Playback position\" aria-valuetext=\"0:00 / 0:08\" min=\"0\" max=\"8\" step=\"0.1\" disabled=\"\"");
    expect(html).toContain("music.wav");
    expect(html).toContain("12 KB");
    expect(html).not.toContain("aria-label=\"Playback speed\"");
    expect(renderToStaticMarkup(content)).toBe(html);
  });

  it("renders videos, audio, voice messages, files and stickers in a classic message", () => {
    const message = {
      ...base,
      media: [image, video],
      attachments: [
        audio,
        {
          ...audio,
          id: "voice",
          voice: true,
          waveform: [0.1, 0.5, 1],
        },
        {
          id: "file",
          kind: "file",
          name: "notes.txt",
          url: "https://example.test/notes.txt",
        },
      ],
      stickers: [sticker],
    } satisfies MessageView;
    const html = renderToStaticMarkup(<Message message={message} />);
    expect(html).toContain("Media message");
    expect(html.match(/<video /gu)).toHaveLength(1);
    expect(html.match(/<audio /gu)).toHaveLength(2);
    expect(html).toContain("dui-player-voice");
    expect(html).toContain("dui-waveform-bar");
    expect(html).toContain("aria-label=\"Playback speed\"");
    expect(html).toContain("notes.txt");
    expect(html).toContain("alt=\"Hello sticker\"");
    expect(JSON.parse(JSON.stringify(message))).toEqual(message);
  });

  it("renders mixed image/video galleries directly and inside Components V2", () => {
    const html = renderToStaticMarkup(<MediaGallery items={[image, video]} />);
    expect(html).toContain("alt=\"Landscape\"");
    expect(html).toContain("<video src=\"/examples/clip.mp4\"");
    const message: MessageView = {
      id: base.id,
      author: base.author,
      timestamp: base.timestamp,
      body: {
        kind: "components-v2",
        components: [
          {
            id: "gallery",
            kind: "media-gallery",
            items: [image, video],
          },
        ],
      },
    };
    const v2 = renderToStaticMarkup(<Message message={message} />);
    expect(v2).toContain("dui-components-v2");
    expect(v2).toContain("alt=\"Landscape\"");
    expect(v2).toContain("<video src=\"/examples/clip.mp4\"");
  });

  it("defers the video, audio and their URLs behind unrevealed spoilers", () => {
    const html = renderToStaticMarkup(
      <>
        <Video video={{ ...video, spoiler: true }} />
        <Audio audio={{ ...audio, spoiler: true }} />
      </>,
    );
    expect(html).toContain("dui-revealable-media");
    expect(html.match(/aria-label="Reveal spoiler"/gu)).toHaveLength(2);
    expect(html).not.toContain("<video");
    expect(html).not.toContain("<audio");
    expect(html).not.toContain(video.url);
    expect(html).not.toContain(video.posterUrl);
    expect(html).not.toContain(audio.url);
  });

  it("caps voice waveform bars and bounds malformed sample heights", () => {
    const waveform = [
      -1,
      Number.NaN,
      Number.POSITIVE_INFINITY,
      2,
      0.5,
      ...Array.from<number>({ length: 300 }).fill(0.25),
    ];
    const html = renderToStaticMarkup(<Audio audio={{ ...audio, voice: true, waveform }} />);
    expect(html.match(/class="dui-waveform-bar"/gu)).toHaveLength(256);
    const heights = [
      ...html.matchAll(/height:([^%;]+)%/gu),
    ].map(match => Number(match[1]));
    expect(heights.slice(0, 5)).toEqual([4, 4, 4, 100, 50]);
    expect(heights.every(height => Number.isFinite(height) && height >= 4 && height <= 100)).toBe(true);
    expect(html).toContain("aria-hidden=\"true\"");
    const noWaveform = renderToStaticMarkup(<Audio audio={{ ...audio, voice: true }} />);
    expect(noWaveform).not.toContain("dui-waveform");
    expect(noWaveform).toContain("class=\"dui-player-seek\"");
    expect(noWaveform).toContain("aria-label=\"Playback speed\"");
  });

  it.each([
    Number.NaN,
    Number.POSITIVE_INFINITY,
    -10,
    0,
  ])("normalizes an invalid duration %s without relying on a clock", (durationSeconds) => {
    const content = (
      <>
        <Audio audio={{ ...audio, durationSeconds }} />
        <Video video={{ ...video, durationSeconds }} />
      </>
    );
    const html = renderToStaticMarkup(content);
    expect(html.match(/aria-valuetext="0:00 \/ 0:00"/gu)).toHaveLength(2);
    expect(html).not.toContain("NaN");
    expect(html).not.toContain("Infinity");
    expect(html).not.toContain("max=\"-10\"");
    expect(renderToStaticMarkup(content)).toBe(html);
  });

  it("localizes the controls, unavailable media and unsupported Lottie state", () => {
    const html = renderToStaticMarkup(
      <DiscordUI labels={{
        mediaPlay: "Lire",
        mediaSeek: "Position",
        mediaVolume: "Volume sonore",
        mediaMute: "Couper le son",
        mediaPlaybackSpeed: "Vitesse",
        mediaUnsupportedSticker: "Format indisponible",
        mediaUnavailable: "Média indisponible",
        downloadFile: "Télécharger {name}",
      }}
      >
        <Audio audio={{ ...audio, url: "https://example.test/music.wav", voice: true }} />
        <Sticker sticker={{ ...sticker, format: "lottie", url: "https://example.test/animation.json" }} />
        <Video video={{ ...video, url: "javascript:alert(1)" }} />
      </DiscordUI>,
    );
    for (const label of [
      "Lire",
      "Position",
      "Volume sonore",
      "Couper le son",
      "Vitesse",
    ])
      expect(html).toContain(`aria-label="${label}"`);
    expect(html).toContain("Format indisponible");
    expect(html).toContain("Média indisponible");
    expect(html).not.toContain("animation.json");
    expect(html).not.toContain("javascript:");
  });

  it.each(["png", "apng", "gif"] as const)("renders %s stickers with their accessible names", (format) => {
    const html = renderToStaticMarkup(<Sticker sticker={{ ...sticker, format }} />);
    expect(html).toContain("class=\"dui-sticker\"");
    expect(html).toContain("src=\"/examples/hello.gif\"");
    expect(html).toContain("alt=\"Hello sticker\"");
    expect(html).toContain("loading=\"lazy\"");
  });
});

describe("media URL policy", () => {
  it("blocks remote players, posters and stickers while keeping root-relative sources", () => {
    const html = renderToStaticMarkup(
      <DiscordUI allowRemoteMedia={false}>
        <Video video={{ ...video, url: "https://example.test/remote.mp4" }} />
        <Audio audio={{ ...audio, url: "https://example.test/remote.ogg" }} />
        <Sticker sticker={{ ...sticker, url: "https://example.test/remote.gif" }} />
        <Video video={{ ...video, posterUrl: "https://example.test/remote-poster.png" }} />
        <Audio audio={audio} />
      </DiscordUI>,
    );
    expect(html).not.toContain("remote.mp4");
    expect(html).not.toContain("remote.ogg");
    expect(html).not.toContain("remote.gif");
    expect(html).not.toContain("remote-poster.png");
    expect(html).toContain("<video src=\"/examples/clip.mp4\"");
    expect(html).toContain("<audio src=\"/examples/music.wav\"");
  });

  it("honors allowlisted sources independently from posters and preserves safe downloads", () => {
    const html = renderToStaticMarkup(
      <DiscordUI allowRemoteMedia={false} remoteMediaAllowlist={["https://example.test/allowed/"]}>
        <Video video={{ ...video, url: "https://example.test/allowed/clip.mp4", posterUrl: "https://example.test/blocked/poster.png" }} />
        <Audio audio={{ ...audio, url: "https://example.test/allowed/music.wav" }} />
        <Sticker sticker={{ ...sticker, url: "https://example.test/allowed/hello.gif" }} />
      </DiscordUI>,
    );
    expect(html).toContain("<video src=\"https://example.test/allowed/clip.mp4\"");
    expect(html).toContain("<audio src=\"https://example.test/allowed/music.wav\"");
    expect(html).toContain("src=\"https://example.test/allowed/hello.gif\"");
    expect(html).not.toContain("blocked/poster.png");
    expect(html).toContain("href=\"https://example.test/allowed/music.wav\"");
    expect(html).toContain("download=\"\"");
  });

  it.each([
    "javascript:alert(1)",
    "//example.test/media",
    "data:text/html;base64,PHNjcmlwdD4=",
    "https://example.test/\nmedia",
  ])("rejects unsafe media source %s", (url) => {
    const html = renderToStaticMarkup(
      <>
        <Video video={{ ...video, url }} />
        <Audio audio={{ ...audio, url }} />
        <Sticker sticker={{ ...sticker, url }} />
      </>,
    );
    expect(html).not.toContain("<video");
    expect(html).not.toContain("<audio");
    expect(html).not.toContain("<img");
    expect(html).not.toContain("href=");
    expect(html).toContain("Media unavailable");
  });
});
