import { mediaUrl } from "@arcscord/discord-ui-core";
import { isUnicodeEmoji } from "@arcscord/discord-ui-core/emoji";
import { useState } from "react";
import { useDisplayOptions } from "../display-context";
import { UnicodeEmoji } from "./unicode-emoji";

function EmojiImage({ name, source }: { name: string; source: string | undefined }) {
  const [failed, setFailed] = useState(false);
  return source && !failed
    ? (
        <img
          className="dui-emoji"
          src={source}
          alt={name
            ? `:${name}:`
            : ""}
          width={22}
          height={22}
          ref={(node) => {
            // Recover failures that occurred before hydration attached onError.
            if (node?.complete && node.naturalWidth === 0)
              setFailed(true);
          }}
          onError={() => setFailed(true)}
        />
      )
    : (
        <span className="dui-emoji-fallback">
          :
          {name}
          :
        </span>
      );
}

export type EmojiProps = { name: string; image?: string | undefined };

export function Emoji({ name, image }: EmojiProps) {
  const { allowRemoteMedia, remoteMediaAllowlist } = useDisplayOptions();
  if (!image && isUnicodeEmoji(name))
    return <UnicodeEmoji content={name} />;
  const source = mediaUrl(image, allowRemoteMedia, remoteMediaAllowlist);
  return <EmojiImage key={source} name={name} source={source} />;
}
