import type { MessageAuthor } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { mediaUrl } from "@arcscord/discord-ui-core";
import { defineRenderer, state, styleValue } from "../../rendering";

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
type AvatarImageInput = { author: MessageAuthor; source: string | undefined };
const AvatarImage = defineRenderer<AvatarImageInput, AvatarImageInput, Record<string, never>>("AvatarImage", ["author", "source"], [], (input, _display) => {
  const [failedState, setFailed] = state<boolean>(false);
  function derive(withSlots = false) {
    const { author, source } = input(withSlots);
    const failed = failedState.value;
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
    return {
      author,
      source,
      failed,
      hash,
      fallback,
      background,
      color,
      text,
      letter,
    };
  }
  return () => {
    const { source, failed, background, color, letter } = derive(true);
    return (
      <span
        class="dui-avatar"
        aria-hidden="true"
        style={styleValue({
          background: source && !failed
            ? "transparent"
            : background,
          color,
        })}
      >
        {source && !failed
          ? <img src={source} alt="" width={40} height={40} onError={() => setFailed(true)} />
          : <span>{letter}</span>}
      </span>
    );
  };
});
type AvatarPropsInput = {
  author: MessageAuthor;
};
export type AvatarProps = AvatarPropsInput;
export type AvatarSlots = Record<string, never>;
export const Avatar = defineRenderer<AvatarProps, AvatarPropsInput, AvatarSlots>("Avatar", ["author"], [], (input, display) => {
  return () => {
    const { author } = input(true);
    const { allowRemoteMedia } = display;
    const source = mediaUrl(author.avatarUrl, allowRemoteMedia);
    return <AvatarImage key={source ?? ""} author={author} source={source} />;
  };
});
export type AvatarEmits = Record<string, never>;
