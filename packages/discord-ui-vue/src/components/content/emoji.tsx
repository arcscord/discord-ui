// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { mediaUrl } from "@arcscord/discord-ui-core";
import { segmentUnicodeEmoji } from "@arcscord/discord-ui-core/emoji";
import { defineRenderer, elementRef, state } from "../../rendering";
import { UnicodeEmoji } from "./unicode-emoji";

type EmojiImageInput = { name: string; source: string | undefined };
const EmojiImage = defineRenderer<EmojiImageInput, EmojiImageInput, Record<string, never>>("EmojiImage", ["name", "source"], [], (input, _display) => {
  const [failedState, setFailed] = state<boolean>(false);
  function derive(withSlots = false) {
    const { name, source } = input(withSlots);
    const failed = failedState.value;
    return { name, source, failed };
  }
  return () => {
    const { name, source, failed } = derive(true);
    return source && !failed
      ? (
          <img
            class="dui-emoji"
            src={source}
            alt={name
              ? `:${name}:`
              : ""}
            width={22}
            height={22}
            ref={(rawElement) => {
              const node = elementRef<HTMLImageElement>(rawElement);
              // Recover failures that occurred before hydration attached onError.
              if (node?.complete && node.naturalWidth === 0)
                setFailed(true);
            }}
            onError={() => setFailed(true)}
          />
        )
      : (
          <span class="dui-emoji-fallback">
            :
            {name}
            :
          </span>
        );
  };
});
type EmojiPropsInput = {
  name: string;
  image?: string | undefined;
};
export type EmojiProps = EmojiPropsInput;
export type EmojiSlots = Record<string, never>;
export const Emoji = defineRenderer<EmojiProps, EmojiPropsInput, EmojiSlots>("Emoji", ["name", "image"], [], (input, display) => {
  return () => {
    const { name, image } = input(true);
    const { allowRemoteMedia } = display;
    const unicode = !image
      ? segmentUnicodeEmoji(name, {
          unicodeEmoji: { mode: "twemoji", baseUrl: "/emoji" },
        }).filter(segment => segment.kind === "emoji")
      : [];
    if (unicode.length === 1 && unicode[0]?.text === name)
      return <UnicodeEmoji content={name} />;
    const source = mediaUrl(image, allowRemoteMedia);
    return <EmojiImage key={source ?? ""} name={name} source={source} />;
  };
});
export type EmojiEmits = Record<string, never>;
