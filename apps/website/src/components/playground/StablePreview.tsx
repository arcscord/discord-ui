import type { ComponentType } from "react";
import { createElement, use, useEffect, useState } from "react";
import { LiveContext } from "react-live";

/** Keep a successfully mounted example when a subsequent edit fails. */
export function StablePreview() {
  const { element, error } = use(LiveContext);
  const [lastGood, setLastGood] = useState<ComponentType | null>(null);
  useEffect(() => {
    if (!element || error)
      return;
    // Initial render failures reach the context before accepting the candidate.
    const timeout = window.setTimeout(() => setLastGood(() => element), 80);
    return () => window.clearTimeout(timeout);
  }, [element, error]);
  const Element = (!error && element) || lastGood;
  return (
    <>
      {error
        ? <p className="preview-stale" role="status">{lastGood ? "Showing the last working preview." : "Fix the code to render a preview."}</p>
        : null}
      {Element
        ? createElement(Element)
        : <p className="preview-loading">Preparing the preview…</p>}
    </>
  );
}

export function CompileStatus() {
  const { error, element } = use(LiveContext);
  return (
    <div className="compile-status" role="status">
      {error
        ? "Check the code below"
        : element ? "Example loaded" : "Compiling…"}
      <span>React (JSX)</span>
    </div>
  );
}

export function CompileError() {
  const { error } = use(LiveContext);
  return error
    ? (
        <div className="compile-error" role="alert">
          <strong>Could not render this edit</strong>
          <pre>{error}</pre>
          <p>Your code is kept. Correct it or use Reset.</p>
        </div>
      )
    : null;
}
