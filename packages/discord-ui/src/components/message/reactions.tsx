import type { ReactionView } from "../../model/reaction";
import { Emoji } from "../content/emoji";
import { useDisplayOptions } from "../display-context";

export type ReactionsProps = {
  reactions: readonly ReactionView[];
  onToggle?: ((reactionId: string) => void) | undefined;
};

export function Reactions({ reactions, onToggle }: ReactionsProps) {
  const { labels, locale } = useDisplayOptions();
  const visible = reactions.filter(reaction => Number.isSafeInteger(reaction.count) && reaction.count > 0);
  if (!visible.length)
    return null;
  const format = new Intl.NumberFormat(locale);
  return (
    <div className="dui-reactions" role="group" aria-label={labels.reactions}>
      {visible.map((reaction) => {
        const content = (
          <>
            <Emoji name={reaction.emoji.name} image={reaction.emoji.image} />
            <span>{format.format(reaction.count)}</span>
          </>
        );
        const label = `${reaction.emoji.name}: ${format.format(reaction.count)}`;
        return onToggle
          ? <button key={reaction.id} type="button" className="dui-reaction" aria-label={label} aria-pressed={Boolean(reaction.me)} onClick={() => onToggle(reaction.id)}>{content}</button>
          : <span key={reaction.id} className="dui-reaction" data-selected={reaction.me || undefined} aria-label={label}>{content}</span>;
      })}
    </div>
  );
}
