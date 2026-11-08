import type { ReactNode } from "react";
import { parse } from "@twemoji/parser";
import { Fragment, useState } from "react";
import { mediaUrl } from "../../utils/urls";
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
  const baseUrl = unicodeEmoji.baseUrl.replace(/\/+$/u, "");
  // Validate the complete source through the same policy as custom emoji/media.
  const entities = parse(content, {
    buildUrl: codepoints => `${baseUrl}/${codepoints}.svg`,
  });
  const nodes: ReactNode[] = [];
  let offset = 0;
  for (const entity of entities) {
    const [start, end] = entity.indices;
    nodes.push(<Fragment key={`text-${start}`}>{content.slice(offset, start)}</Fragment>);
    const source = unicodeEmoji.baseUrl
      ? mediaUrl(entity.url, allowRemoteMedia)
      : undefined;
    nodes.push(source
      ? <UnicodeEmojiImage key={`${start}-${source}`} text={entity.text} url={source} />
      : <Fragment key={`emoji-${start}`}>{entity.text}</Fragment>);
    offset = end;
  }
  nodes.push(<Fragment key="tail">{content.slice(offset)}</Fragment>);
  return <>{nodes}</>;
}
