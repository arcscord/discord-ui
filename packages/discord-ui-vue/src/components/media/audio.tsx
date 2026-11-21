import type { AudioView } from "@arcscord/discord-ui-core";
import { mediaUrl } from "@arcscord/discord-ui-core";
import { defineRenderer } from "../../rendering";
import { Spoiler } from "../content/spoiler";
import { Player } from "./player";

export type AudioProps = { audio: AudioView };
export type AudioSlots = Record<string, never>;
export type AudioEmits = Record<string, never>;
export const Audio = defineRenderer<AudioProps, AudioProps, AudioSlots>("Audio", ["audio"], [], (input, display) => () => {
  const { audio } = input();
  const source = mediaUrl(audio.url, display.allowRemoteMedia, display.remoteMediaAllowlist);
  const player = () => <Player key={`${audio.id}:${source ?? ""}`} media={audio} source={source} />;
  return audio.spoiler
    ? <div class="dui-media-spoiler"><Spoiler key={`${audio.id}:${source ?? ""}`} inline={false} v-slots={{ default: player }} /></div>
    : player();
});
