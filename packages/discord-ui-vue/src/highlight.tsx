// Optional highlighter adapted from AutoThreads; see THIRD_PARTY_NOTICES.
import type { HighlightToken } from "@arcscord/discord-ui-core/highlight";
import type { VNodeChild } from "vue";
import { highlightCode } from "@arcscord/discord-ui-core/highlight";

function tokenNode(token: HighlightToken, key: string): VNodeChild {
  if (token.type === "text")
    return token.value;
  return (
    <span key={key} class={token.classes.join(" ")}>
      {token.children.map((child, index) => tokenNode(child, `${key}-${index}`))}
    </span>
  );
}
export function renderHighlightedCode(content: string, language: string): VNodeChild {
  const result = highlightCode(content, language);
  return result.language
    ? <code class={`language-${result.language}`}>{result.tokens.map((token, index) => tokenNode(token, String(index)))}</code>
    : <code>{content}</code>;
}
