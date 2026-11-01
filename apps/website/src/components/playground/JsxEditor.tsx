/* eslint react/no-array-index-key: off -- Highlighted tokens are stateless text spans indexed by source position. */
import { Highlight, themes } from "prism-react-renderer";
import { useRef } from "react";

/** Native text editing keeps selection, paste, undo and keyboard focus reliable. */
export function JsxEditor({ code, onChange, onEscape }: { code: string; onChange: (code: string) => void; onEscape: () => void }) {
  const highlightRef = useRef<HTMLDivElement>(null);
  return (
    <div className="jsx-editor">
      <div className="jsx-highlight" aria-hidden="true" ref={highlightRef}>
        <Highlight code={code} language="jsx" theme={themes.oneDark}>
          {({ tokens, getTokenProps }) => (
            <pre>
              {tokens.map((line, index) => (
                <div className="editor-line" key={`line-${index}`}>
                  <span className="editor-line-number">{index + 1}</span>
                  {line.map((token, tokenIndex) => <span key={`token-${tokenIndex}`} {...getTokenProps({ token })} />)}
                  {line.length === 0
                    ? " "
                    : null}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      </div>
      <textarea
        aria-label="React JSX editor"
        aria-describedby="editor-help"
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        wrap="off"
        value={code}
        onChange={event => onChange(event.target.value)}
        onScroll={(event) => {
          if (highlightRef.current) {
            highlightRef.current.scrollTop = event.currentTarget.scrollTop;
            highlightRef.current.scrollLeft = event.currentTarget.scrollLeft;
          }
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            onEscape();
          }
        }}
      />
    </div>
  );
}
