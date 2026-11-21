import type { AudioView } from "@arcscord/discord-ui-core";
import { mediaUrl } from "@arcscord/discord-ui-core";
import { Spoiler } from "../content/spoiler";
import { useDisplayOptions } from "../display-context";
import { Player } from "./player";

export type AudioProps = { audio: AudioView };
export function Audio({ audio }: AudioProps) {
  const { allowRemoteMedia, remoteMediaAllowlist } = useDisplayOptions();
  const source = mediaUrl(audio.url, allowRemoteMedia, remoteMediaAllowlist);
  const player = <Player key={`${audio.id}:${source}`} media={audio} source={source} />;
  return audio.spoiler
    ? <div className="dui-media-spoiler"><Spoiler key={`${audio.id}:${source}`} inline={false}>{player}</Spoiler></div>
    : player;
}
