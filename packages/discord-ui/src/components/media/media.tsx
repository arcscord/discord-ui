import type { MediaView } from "../../model/content";
import { useState } from "react";
import { mediaUrl } from "../../utils/urls";
import { Spoiler } from "../content/spoiler";
import { useDisplayOptions } from "../display-context";

function MediaImage({ media, source }: { media: MediaView; source: string | undefined }) {
  const [failed, setFailed] = useState(false);
  const { labels } = useDisplayOptions();
  return (
    <figure className="dui-media">
      {source && !failed
        ? <img src={source} alt={media.alt} width={media.width} height={media.height} loading="lazy" onError={() => setFailed(true)} />
        : <div className="dui-media-error" role="img" aria-label={`${labels.mediaUnavailable}: ${media.alt}`}>{labels.mediaUnavailable}</div>}
    </figure>
  );
}

export function Media({ media }: { media: MediaView }) {
  const { allowRemoteMedia } = useDisplayOptions();
  const source = mediaUrl(media.url, allowRemoteMedia);
  const image = <MediaImage key={source} media={media} source={source} />;
  return media.spoiler
    ? <div className="dui-media-spoiler"><Spoiler key={media.id} inline={false} placeholder={<div className="dui-media-placeholder" style={{ aspectRatio: `${media.width || 16} / ${media.height || 9}`, minHeight: 0 }} />}>{image}</Spoiler></div>
    : image;
}
