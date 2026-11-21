import type { VideoView } from "@arcscord/discord-ui-core";
import { mediaUrl } from "@arcscord/discord-ui-core";
import { defineRenderer, styleValue } from "../../rendering";
import { Spoiler } from "../content/spoiler";
import { Player } from "./player";

export type VideoProps = { video: VideoView };
export type VideoSlots = Record<string, never>;
export type VideoEmits = Record<string, never>;
export const Video = defineRenderer<VideoProps, VideoProps, VideoSlots>("Video", ["video"], [], (input, display) => () => {
  const { video } = input();
  const source = mediaUrl(video.url, display.allowRemoteMedia, display.remoteMediaAllowlist);
  const player = () => <Player key={`${video.id}:${source ?? ""}`} media={video} source={source} />;
  return video.spoiler
    ? (
        <div class="dui-media-spoiler">
          <Spoiler
            key={`${video.id}:${source ?? ""}`}
            inline={false}
            v-slots={{
              default: player,
              placeholder: () => <div class="dui-media-placeholder" style={styleValue({ aspectRatio: `${video.width || 16} / ${video.height || 9}`, minHeight: 0 })} />,
            }}
          />
        </div>
      )
    : player();
});
