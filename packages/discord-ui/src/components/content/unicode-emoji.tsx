import type { ReactNode } from "react";
import { parse } from "@twemoji/parser";
import { Fragment, useState } from "react";
import { useDisplayOptions } from "../display-context";

function UnicodeEmojiImage({ text, url }: { text: string; url: string }) {
  const [failed, setFailed] = useState(false);
  return failed
    ? <>{text}</>
    : <img className="dui-emoji dui-unicode-emoji" src={url} alt={text} width={22} height={22} draggable={false} onError={() => setFailed(true)} />;
}

/** Render Unicode emoji as React nodes, without injecting or mutating HTML. */
export function UnicodeEmoji({ content }: { content: string }) {
  const { allowRemoteMedia } = useDisplayOptions();
  if (!allowRemoteMedia)
    return <>{content}</>;
  const entities = parse(content);
  const nodes: ReactNode[] = [];
  let offset = 0;
  for (const entity of entities) {
    const [start, end] = entity.indices;
    nodes.push(<Fragment key={`text-${start}`}>{content.slice(offset, start)}</Fragment>);
    nodes.push(<UnicodeEmojiImage key={`${start}-${entity.text}`} text={entity.text} url={entity.url.replace("@latest/", "@17.0.3/")} />);
    offset = end;
  }
  nodes.push(<Fragment key="tail">{content.slice(offset)}</Fragment>);
  return <>{nodes}</>;
}
