// Optional highlighter adapted from AutoThreads; see THIRD_PARTY_NOTICES.
import type { HighlightToken } from "@arcscord/discord-ui-core/highlight";
import type { ReactNode } from "react";
import { highlightCode } from "@arcscord/discord-ui-core/highlight";

function tokenNode(token: HighlightToken, key: string): ReactNode {
  if (token.type === "text")
    return token.value;
  return (
    <span key={key} className={token.classes.join(" ")}>
      {token.children.map((child, index) => tokenNode(child, `${key}-${index}`))}
    </span>
  );
}
export function renderHighlightedCode(content: string, language: string): ReactNode {
  const result = highlightCode(content, language);
  return result.language
    ? <code className={`language-${result.language}`}>{result.tokens.map((token, index) => tokenNode(token, String(index)))}</code>
    : <code>{content}</code>;
}
