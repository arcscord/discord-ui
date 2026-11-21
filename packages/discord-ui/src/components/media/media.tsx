import type { MediaView, MessageMediaView } from "@arcscord/discord-ui-core";
import { mediaUrl } from "@arcscord/discord-ui-core";
import { useState } from "react";
import { Spoiler } from "../content/spoiler";
import { useDisplayOptions } from "../display-context";
import { Video } from "./video";

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

export type MediaProps = { media: MessageMediaView };

export function Media({ media }: MediaProps) {
  const { allowRemoteMedia, remoteMediaAllowlist } = useDisplayOptions();
  if ("kind" in media && media.kind === "video")
    return <Video video={media} />;
  const source = mediaUrl(media.url, allowRemoteMedia, remoteMediaAllowlist);
  const image = <MediaImage key={source} media={media} source={source} />;
  return media.spoiler
    ? <div className="dui-media-spoiler"><Spoiler key={media.id} inline={false} placeholder={<div className="dui-media-placeholder" style={{ aspectRatio: `${media.width || 16} / ${media.height || 9}`, minHeight: 0 }} />}>{image}</Spoiler></div>
    : image;
}
