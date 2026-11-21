import type { StickerView } from "@arcscord/discord-ui-core";
import { defaultMediaLabels, mediaUrl } from "@arcscord/discord-ui-core";
import { defineRenderer, state } from "../../rendering";

type StickerImageProps = { sticker: StickerView; source: string | undefined };
const StickerImage = defineRenderer<StickerImageProps, StickerImageProps, Record<string, never>>("StickerImage", ["sticker", "source"], [], (input, display) => {
  const [failed, setFailed] = state(false);
  return () => {
    const { sticker, source } = input();
    const labels = {
      ...defaultMediaLabels,
      ...display.labels,
    };
    return (
      <figure class="dui-sticker">
        {sticker.format === "lottie"
          ? (
              <div class="dui-media-error" role="status">
                {`${labels.mediaUnsupportedSticker}: ${sticker.name}`}
              </div>
            )
          : source && !failed.value
            ? <img src={source} alt={sticker.name} width="160" height="160" loading="lazy" onError={() => setFailed(true)} />
            : (
                <div class="dui-media-error" role="status">
                  {`${labels.mediaUnavailable}: ${sticker.name}`}
                </div>
              )}
      </figure>
    );
  };
});

export type StickerProps = { sticker: StickerView };
export type StickerSlots = Record<string, never>;
export type StickerEmits = Record<string, never>;
export const Sticker = defineRenderer<StickerProps, StickerProps, StickerSlots>("Sticker", ["sticker"], [], (input, display) => () => {
  const { sticker } = input();
  const source = mediaUrl(sticker.url, display.allowRemoteMedia, display.remoteMediaAllowlist);
  return <StickerImage key={`${sticker.id}:${source ?? ""}:${sticker.format}`} sticker={sticker} source={source} />;
});
