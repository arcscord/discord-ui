import type { ReactNode } from "react";
import { useState } from "react";
import { useDisplayOptions } from "../display-context";

export function Spoiler({ children, inline = true }: { children: ReactNode; inline?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const { labels } = useDisplayOptions();
  const Wrapper = inline ? "span" : "div";
  return (
    <Wrapper className={`dui-spoiler ${revealed ? "dui-spoiler-revealed" : ""}`}>
      <button type="button" className="dui-spoiler-toggle" aria-expanded={revealed} aria-label={revealed ? labels.hideSpoiler : labels.showSpoiler} onClick={() => setRevealed(value => !value)}>{revealed ? "×" : labels.spoiler}</button>
      {revealed
        ? <Wrapper className="dui-spoiler-content">{children}</Wrapper>
        : null}
    </Wrapper>
  );
}
