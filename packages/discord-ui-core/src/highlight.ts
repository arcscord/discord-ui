// Optional highlighter adapted from AutoThreads; see THIRD_PARTY_NOTICES.
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
export type HighlightToken
  = | { type: "text"; value: string }
    | { type: "element"; classes: string[]; children: HighlightToken[] };
export type HighlightResult = { language: string | undefined; tokens: HighlightToken[] };
type Token = ReturnType<typeof highlighter.highlight>["children"][number];
function tokens(nodes: Token[]): HighlightToken[] {
  return nodes.flatMap((node): HighlightToken[] => {
    if (node.type === "text") {
      return [
        { type: "text", value: node.value },
      ];
    }
    if (node.type !== "element")
      return [];
    return [
      {
        type: "element",
        classes: Array.isArray(node.properties.className)
          ? node.properties.className.map(String)
          : [],
        children: tokens(node.children),
      },
    ];
  });
}
export function highlightCode(content: string, language: string): HighlightResult {
  const normalized = language.toLowerCase();
  return highlighter.registered(normalized)
    ? {
        language: normalized,
        tokens: tokens(highlighter.highlight(normalized, content).children),
      }
    : {
        language: undefined,
        tokens: [
          { type: "text", value: content },
        ],
      };
}
