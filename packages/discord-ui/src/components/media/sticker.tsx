import type { StickerView } from "@arcscord/discord-ui-core";
import { defaultMediaLabels, mediaUrl } from "@arcscord/discord-ui-core";
import { useState } from "react";
import { useDisplayOptions } from "../display-context";

export type StickerProps = { sticker: StickerView };
function StickerImage({ sticker, source }: StickerProps & { source: string | undefined }) {
  const [failed, setFailed] = useState(false);
  const { labels } = useDisplayOptions();
  return (
    <figure className="dui-sticker">
      {sticker.format === "lottie"
        ? (
            <div className="dui-media-error" role="status">
              {`${labels.mediaUnsupportedSticker ?? defaultMediaLabels.mediaUnsupportedSticker}: ${sticker.name}`}
            </div>
          )
        : source && !failed
          ? <img src={source} alt={sticker.name} width={160} height={160} loading="lazy" onError={() => setFailed(true)} />
          : <div className="dui-media-error" role="status">{`${labels.mediaUnavailable}: ${sticker.name}`}</div>}
    </figure>
  );
}
export function Sticker({ sticker }: StickerProps) {
  const { allowRemoteMedia, remoteMediaAllowlist } = useDisplayOptions();
  const source = mediaUrl(sticker.url, allowRemoteMedia, remoteMediaAllowlist);
  return <StickerImage key={`${sticker.id}:${source}:${sticker.format}`} sticker={sticker} source={source} />;
}
