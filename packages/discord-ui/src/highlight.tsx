// Optional highlighter adapted from AutoThreads; see THIRD_PARTY_NOTICES.
import type { ReactNode } from "react";
import bash from "highlight.js/lib/languages/bash";
import css from "highlight.js/lib/languages/css";
import javascript from "highlight.js/lib/languages/javascript";
import json from "highlight.js/lib/languages/json";
import python from "highlight.js/lib/languages/python";
import typescript from "highlight.js/lib/languages/typescript";
import { createLowlight } from "lowlight";

const highlighter = createLowlight({
  javascript,
  typescript,
  json,
  css,
  bash,
  python,
});
type Token = ReturnType<typeof highlighter.highlight>["children"][number];
function tokenNode(token: Token, key: string): ReactNode {
  if (token.type === "text")
    return token.value;
  if (token.type !== "element")
    return null;
  const classes = token.properties.className;
  return (
    <span
      key={key}
      className={Array.isArray(classes)
        ? classes.join(" ")
        : undefined}
    >
      {token.children.map((child, index) => tokenNode(child, `${key}-${index}`))}
    </span>
  );
}
export function renderHighlightedCode(content: string, language: string): ReactNode {
  const normalized = language.toLowerCase();
  if (!highlighter.registered(normalized))
    return <code>{content}</code>;
  return <code className={`language-${normalized}`}>{highlighter.highlight(normalized, content).children.map((token, index) => tokenNode(token, String(index)))}</code>;
}
