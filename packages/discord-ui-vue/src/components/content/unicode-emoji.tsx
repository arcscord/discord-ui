// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { segmentUnicodeEmoji } from "@arcscord/discord-ui-core/emoji";
import { Fragment } from "vue";
import { defineRenderer, elementRef, state } from "../../rendering";

type UnicodeEmojiImageInput = { text: string; url: string };
const UnicodeEmojiImage = defineRenderer<UnicodeEmojiImageInput, UnicodeEmojiImageInput, Record<string, never>>("UnicodeEmojiImage", ["text", "url"], [], (input, _display) => {
  const [failedState, setFailed] = state<boolean>(false);
  function derive(withSlots = false) {
    const { text, url } = input(withSlots);
    const failed = failedState.value;
    return { text, url, failed };
  }
  return () => {
    const { text, url, failed } = derive(true);
    return failed
      ? <>{text}</>
      : (
          <img
            class="dui-emoji dui-unicode-emoji"
            src={url}
            alt={text}
            width={22}
            height={22}
            draggable={false}
            ref={(rawElement) => {
              const node = elementRef<HTMLImageElement>(rawElement);
              // SSR images can fail before React installs the onError handler.
              if (node?.complete && node.naturalWidth === 0)
                setFailed(true);
            }}
            onError={() => setFailed(true)}
          />
        );
  };
});
type UnicodeEmojiInput = { content: string };
export type UnicodeEmojiProps = UnicodeEmojiInput;
export type UnicodeEmojiSlots = Record<string, never>;
export const UnicodeEmoji = defineRenderer<UnicodeEmojiProps, UnicodeEmojiInput, UnicodeEmojiSlots>("UnicodeEmoji", ["content"], [], (input, display) => {
  return () => {
    const { content } = input(true);
    const { allowRemoteMedia, unicodeEmoji = { mode: "native" } } = display;
    if (unicodeEmoji.mode === "native")
      return <>{content}</>;
    return (
      <>
        {segmentUnicodeEmoji(content, { unicodeEmoji, allowRemoteMedia }).map(segment => segment.kind === "emoji" && segment.source
          ? <UnicodeEmojiImage key={`${segment.start}-${segment.source}`} text={segment.text} url={segment.source} />
          : <Fragment key={`${segment.kind}-${segment.start}`}>{segment.text}</Fragment>)}
      </>
    );
  };
});
export type UnicodeEmojiEmits = Record<string, never>;
