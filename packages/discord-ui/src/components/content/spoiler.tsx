import type { ReactNode } from "react";
import { useState } from "react";
import { useDisplayOptions } from "../display-context";

/** Text keeps its natural size under the mask; media is not mounted before reveal. */
export function Spoiler({ children, inline = true, placeholder }: { children: ReactNode; inline?: boolean; placeholder?: ReactNode }) {
  const [revealed, setRevealed] = useState(false);
  const { labels } = useDisplayOptions();
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className={inline ? "dui-revealable-text" : "dui-revealable-media"} data-revealed={revealed}>
      <Wrapper className="dui-spoiler-content" aria-hidden={!revealed} inert={!revealed}>
        {inline || revealed
          ? children
          : placeholder ?? <div className="dui-media-placeholder" />}
      </Wrapper>
      <button type="button" className={revealed ? "dui-spoiler-close" : "dui-spoiler-toggle"} aria-expanded={revealed} aria-label={revealed ? labels.hideSpoiler : labels.showSpoiler} onClick={() => setRevealed(value => !value)}>
        {revealed
          ? "×"
          : inline
            ? null
            : <span className="dui-spoiler-badge" aria-hidden="true">{labels.spoiler}</span>}
      </button>
    </Wrapper>
  );
}
