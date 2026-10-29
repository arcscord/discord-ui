import type { MediaView } from "../../model/content";
import { Media } from "./media";

export function MediaGallery({ items }: { items: readonly MediaView[] }) {
  return (
    <div className={`dui-media-gallery dui-media-gallery-${items.length === 1
      ? "single"
      : "multiple"}`}
    >
      {items.map(media => <Media key={media.id} media={media} />)}
    </div>
  );
}
