import { useState } from "react";
import { mediaUrl } from "../../utils/urls";
import { useDisplayOptions } from "../display-context";

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

export function Emoji({ name, image }: { name: string; image?: string | undefined }) {
  const { allowRemoteMedia } = useDisplayOptions();
  const source = mediaUrl(image, allowRemoteMedia);
  return <EmojiImage key={source} name={name} source={source} />;
}
