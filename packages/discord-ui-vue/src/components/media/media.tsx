import type { MediaView } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { mediaUrl } from "@arcscord/discord-ui-core";
import { defineRenderer, state, styleValue } from "../../rendering";
import { Spoiler } from "../content/spoiler";

type MediaImageInput = { media: MediaView; source: string | undefined };
const MediaImage = defineRenderer<MediaImageInput, MediaImageInput, Record<string, never>>("MediaImage", ["media", "source"], [], (input, display) => {
  const [failedState, setFailed] = state<boolean>(false);
  function derive(withSlots = false) {
    const { media, source } = input(withSlots);
    const failed = failedState.value;
    const { labels } = display;
    return { media, source, failed, labels };
  }
  return () => {
    const { media, source, failed, labels } = derive(true);
    return (
      <figure class="dui-media">
        {source && !failed
          ? <img src={source} alt={media.alt} width={media.width} height={media.height} loading="lazy" onError={() => setFailed(true)} />
          : <div class="dui-media-error" role="img" aria-label={`${labels.mediaUnavailable}: ${media.alt}`}>{labels.mediaUnavailable}</div>}
      </figure>
    );
  };
});
type MediaPropsInput = {
  media: MediaView;
};
export type MediaProps = MediaPropsInput;
export type MediaSlots = Record<string, never>;
export const Media = defineRenderer<MediaProps, MediaPropsInput, MediaSlots>("Media", ["media"], [], (input, display) => {
  return () => {
    const { media } = input(true);
    const { allowRemoteMedia } = display;
    const source = mediaUrl(media.url, allowRemoteMedia);
    const image = <MediaImage key={source ?? ""} media={media} source={source} />;
    return media.spoiler
      ? (
          <div class="dui-media-spoiler">
            <Spoiler
              key={media.id}
              inline={false}
              v-slots={{
                placeholder: () => <div class="dui-media-placeholder" style={styleValue({ aspectRatio: `${media.width || 16} / ${media.height || 9}`, minHeight: 0 })} />,
              }}
            >
              {image}
            </Spoiler>
          </div>
        )
      : image;
  };
});
export type MediaEmits = Record<string, never>;
