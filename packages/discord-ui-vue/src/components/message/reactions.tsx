import type { ReactionView } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { defineRenderer } from "../../rendering";
import { Emoji } from "../content/emoji";

type ReactionsPropsInput = {
  reactions: readonly ReactionView[];
  onToggle?: ((reactionId: string) => void) | undefined;
};
export type ReactionsProps = ReactionsPropsInput;
export type ReactionsSlots = Record<string, never>;
export const Reactions = defineRenderer<ReactionsProps, ReactionsPropsInput, ReactionsSlots>("Reactions", ["reactions", "onToggle"], [], (input, display) => {
  return () => {
    const { reactions, onToggle } = input(true);
    const { labels, locale } = display;
    const visible = reactions.filter(reaction => Number.isSafeInteger(reaction.count) && reaction.count > 0);
    if (!visible.length)
      return null;
    const format = new Intl.NumberFormat(locale);
    return (
      <div class="dui-reactions" role="group" aria-label={labels.reactions}>
        {visible.map((reaction) => {
          const content = (
            <>
              <Emoji name={reaction.emoji.name} image={reaction.emoji.image} />
              <span>{format.format(reaction.count)}</span>
            </>
          );
          const label = `${reaction.emoji.name}: ${format.format(reaction.count)}`;
          return onToggle
            ? <button key={reaction.id} type="button" class="dui-reaction" aria-label={label} aria-pressed={Boolean(reaction.me)} onClick={() => onToggle(reaction.id)}>{content}</button>
            : <span key={reaction.id} class="dui-reaction" data-selected={reaction.me || undefined} aria-label={label}>{content}</span>;
        })}
      </div>
    );
  };
});
export type ReactionsEmits = { toggle: Parameters<NonNullable<ReactionsProps["onToggle"]>> };
