import { segmentUnicodeEmoji } from "@arcscord/discord-ui-core/emoji";
import { Fragment, useState } from "react";
import { useDisplayOptions } from "../display-context";

function UnicodeEmojiImage({ text, url }: { text: string; url: string }) {
  const [failed, setFailed] = useState(false);
  return failed
    ? <>{text}</>
    : (
        <img
          className="dui-emoji dui-unicode-emoji"
          src={url}
          alt={text}
          width={22}
          height={22}
          draggable={false}
          ref={(node) => {
            // SSR images can fail before React installs the onError handler.
            if (node?.complete && node.naturalWidth === 0)
              setFailed(true);
          }}
          onError={() => setFailed(true)}
        />
      );
}

/** Render Unicode emoji as React nodes, without injecting or mutating HTML. */
export function UnicodeEmoji({ content }: { content: string }) {
  const { allowRemoteMedia, unicodeEmoji = { mode: "native" } } = useDisplayOptions();
  if (unicodeEmoji.mode === "native")
    return <>{content}</>;
  return (
    <>
      {segmentUnicodeEmoji(content, { unicodeEmoji, allowRemoteMedia }).map(segment => segment.kind === "emoji" && segment.source
        ? <UnicodeEmojiImage key={`${segment.start}-${segment.source}`} text={segment.text} url={segment.source} />
        : <Fragment key={`${segment.kind}-${segment.start}`}>{segment.text}</Fragment>)}
    </>
  );
}
