import type { MediaView } from "../../model/content";
import { Media } from "./media";

export type MediaGalleryProps = { items: readonly MediaView[] };

export function MediaGallery({ items }: MediaGalleryProps) {
  return (
    <div className={`dui-media-gallery dui-media-gallery-${items.length === 1
      ? "single"
      : "multiple"}`}
    >
      {items.map(media => <div key={media.id} className="dui-media-gallery-item"><Media media={media} /></div>)}
    </div>
  );
}
