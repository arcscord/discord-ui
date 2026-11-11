import type { MediaView } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { defineRenderer } from "../../rendering";
import { Media } from "./media";

type MediaGalleryPropsInput = {
  items: readonly MediaView[];
};
export type MediaGalleryProps = MediaGalleryPropsInput;
export type MediaGallerySlots = Record<string, never>;
export const MediaGallery = defineRenderer<MediaGalleryProps, MediaGalleryPropsInput, MediaGallerySlots>("MediaGallery", ["items"], [], (input, _display) => {
  return () => {
    const { items } = input(true);

    return (
      <div class={`dui-media-gallery dui-media-gallery-${items.length === 1
        ? "single"
        : "multiple"}`}
      >
        {items.map(media => <div key={media.id} class="dui-media-gallery-item"><Media media={media} /></div>)}
      </div>
    );
  };
});
export type MediaGalleryEmits = Record<string, never>;
