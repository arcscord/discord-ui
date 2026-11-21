import type { VideoView } from "@arcscord/discord-ui-core";
import { mediaUrl } from "@arcscord/discord-ui-core";
import { Spoiler } from "../content/spoiler";
import { useDisplayOptions } from "../display-context";
import { Player } from "./player";

export type VideoProps = { video: VideoView };
export function Video({ video }: VideoProps) {
  const { allowRemoteMedia, remoteMediaAllowlist } = useDisplayOptions();
  const source = mediaUrl(video.url, allowRemoteMedia, remoteMediaAllowlist);
  const player = <Player key={`${video.id}:${source}`} media={video} source={source} />;
  return video.spoiler
    ? <div className="dui-media-spoiler"><Spoiler key={`${video.id}:${source}`} inline={false} placeholder={<div className="dui-media-placeholder" style={{ aspectRatio: `${video.width || 16} / ${video.height || 9}`, minHeight: 0 }} />}>{player}</Spoiler></div>
    : player;
}
