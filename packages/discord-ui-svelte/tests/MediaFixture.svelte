<script lang="ts">
  import type { AudioView, StickerView, VideoView } from "@arcscord/discord-ui-core";
  import { Audio, DiscordUI, MediaGallery, Sticker } from "../src/index.js";

  const { allowRemoteMedia = false }: { allowRemoteMedia?: boolean } = $props();
  const video: VideoView = {
    id: "video",
    kind: "video",
    url: "https://media.example.test/clip.mp4",
    alt: "Clip",
    posterUrl: "https://media.example.test/poster.png",
  };
  const audio: AudioView = {
    id: "audio",
    kind: "audio",
    url: "https://media.example.test/voice.ogg",
    name: "Voice",
    voice: true,
    durationSeconds: 2,
    waveform: [0.25, 0.5, 1],
  };
  const sticker: StickerView = {
    id: "sticker",
    name: "Wave",
    format: "gif",
    url: "https://media.example.test/wave.gif",
  };
</script>

<DiscordUI {allowRemoteMedia} labels={{ mediaUnsupportedSticker: "Unsupported sticker format" }}>
  <MediaGallery items={[
    video,
    { id: "image", url: "/image.png", alt: "Image" },
  ]} />
  <Audio {audio} />
  <Sticker {sticker} />
  <Sticker sticker={{
    ...sticker,
    id: "lottie",
    format: "lottie",
    url: "https://media.example.test/sticker.json",
  }} />
  <MediaGallery items={[
    {
      ...video,
      id: "hidden-video",
      url: "/hidden.mp4",
      spoiler: true,
    },
  ]} />
  <Audio audio={{
    ...audio,
    id: "hidden-audio",
    url: "/hidden.ogg",
    spoiler: true,
  }} />
</DiscordUI>
