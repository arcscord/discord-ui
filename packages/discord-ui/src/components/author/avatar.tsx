import type { MessageAuthor } from "../../model/message";
import { useState } from "react";
import { mediaUrl } from "../../utils/urls";
import { useDisplayOptions } from "../display-context";

const backgrounds = [
  "#5865f2",
  "#3b8066",
  "#a94c70",
  "#98601d",
  "#6955a4",
  "#337c96",
];
const segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

function hexColor(value: string | undefined): string | undefined {
  return /^#[a-f\d]{6}$/iu.test(value ?? "")
    ? value
    : undefined;
}

function AvatarImage({ author, source }: { author: MessageAuthor; source: string | undefined }) {
  const [failed, setFailed] = useState(false);
  let hash = 0;
  for (const character of author.id)
    hash = (hash * 31 + character.codePointAt(0)!) >>> 0;
  const fallback = author.avatarFallback;
  const background = hexColor(fallback?.background) ?? backgrounds[hash % backgrounds.length];
  const color = hexColor(fallback?.color) ?? "#ffffff";
  const text = fallback?.letter?.trim() || author.displayName.trim();
  const letter = [
    ...segmenter.segment(text),
  ][0]?.segment.toLocaleUpperCase("en-US") || "?";
  return (
    <span
      className="dui-avatar"
      aria-hidden="true"
      style={{
        background: source && !failed
          ? "transparent"
          : background,
        color,
      }}
    >
      {source && !failed
        ? <img src={source} alt="" width={40} height={40} onError={() => setFailed(true)} />
        : <span>{letter}</span>}
    </span>
  );
}

export function Avatar({ author }: { author: MessageAuthor }) {
  const { allowRemoteMedia } = useDisplayOptions();
  const source = mediaUrl(author.avatarUrl, allowRemoteMedia);
  return <AvatarImage key={source} author={author} source={source} />;
}
