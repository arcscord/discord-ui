import type { ThemeName } from "@arcscord/discord-ui";
import type { RefObject } from "react";
import type { ComponentExample } from "../../data/component-examples";
import Link from "@docusaurus/Link";
import { useHistory, useLocation } from "@docusaurus/router";
import DocusaurusLiveProvider from "@docusaurus/theme-live-codeblock/lib/theme/Playground/Provider/index.js";
import { useCallback, useEffect, useRef, useState } from "react";
import { componentExamples, exampleLayout, getExample } from "../../data/component-examples";
import DocumentationLinks from "../docs/DocumentationLinks";
import { ThemeControl } from "../ThemeControl";
import { readDraft, sourceVersion, writeDraft } from "./draft-storage";
import { changeModuleTheme, exportCode, readModuleTheme } from "./export-code";
import { JsxEditor } from "./JsxEditor";
import { compileModule, moduleScope } from "./module-runtime";
import { CompileError, CompileStatus, StablePreview } from "./StablePreview";

export default function PlaygroundEditor() {
  const location = useLocation();
  const history = useHistory();
  const parameters = new URLSearchParams(location.search);
  const example = getExample(parameters.get("example"));
  const requestedTheme = parameters.get("theme");
  const initialTheme = requestedTheme === "light" || requestedTheme === "ash"
    ? requestedTheme
    : "dark";
  const [width, setWidth] = useState(760);
  const selectRef = useRef<HTMLSelectElement>(null);
  const restoreSelectFocusRef = useRef(false);
  useEffect(() => {
    if (!restoreSelectFocusRef.current)
      return;
    const frame = window.requestAnimationFrame(() => {
      restoreSelectFocusRef.current = false;
      selectRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [example.id]);
  function chooseExample(id: string) {
    restoreSelectFocusRef.current = true;
    history.push({ pathname: "/playground", search: `?example=${id}` });
  }
  return <ExampleEditor key={example.id} example={example} initialTheme={initialTheme} width={width} onWidthChange={setWidth} onExampleChange={chooseExample} selectRef={selectRef} />;
}

function ExampleEditor({ example, initialTheme, width, onWidthChange, onExampleChange, selectRef }: { example: ComponentExample; initialTheme: ThemeName; width: number; onWidthChange: (width: number) => void; onExampleChange: (id: string) => void; selectRef: RefObject<HTMLSelectElement | null> }) {
  const canonicalCode = exportCode(example.code, "dark");
  const [draft, setDraft] = useState(() => readDraft(example.id, exportCode(example.code, initialTheme), canonicalCode));
  const outdated = draft.baseline !== sourceVersion(canonicalCode);
  const { code, beforeReset } = draft;
  const [compiledCode, setCompiledCode] = useState(code);
  const theme = readModuleTheme(code);
  const [actualWidth, setActualWidth] = useState<number>();
  const [run, setRun] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const resetRef = useRef<HTMLButtonElement>(null);
  const observeWidth = useCallback((node: HTMLDivElement | null) => {
    if (!node)
      return;
    setActualWidth(Math.round(node.getBoundingClientRect().width));
    const observer = new ResizeObserver(([entry]) => setActualWidth(Math.round(entry!.contentRect.width)));
    observer.observe(node);
    return () => observer.disconnect();
  }, []);
  function updateDraft(next: typeof draft) {
    writeDraft(example.id, next);
    setDraft(next);
    setCopyStatus("");
  }
  function setCode(next: string) {
    updateDraft({ code: next, baseline: draft.baseline });
  }
  useEffect(() => {
    const timeout = window.setTimeout(setCompiledCode, 300, code);
    return () => window.clearTimeout(timeout);
  }, [code]);
  function reset() {
    const initialCode = exportCode(example.code, theme ?? initialTheme);
    updateDraft({
      code: initialCode,
      baseline: sourceVersion(canonicalCode),
      beforeResetBaseline: code === initialCode
        ? draft.beforeResetBaseline
        : draft.baseline,
      beforeReset: code === initialCode
        ? beforeReset
        : code,
    });
    setCompiledCode(initialCode);
    setRun(current => current + 1);
    setCopyStatus("");
  }
  function undoReset() {
    if (beforeReset === undefined)
      return;
    updateDraft({ code: beforeReset, baseline: draft.beforeResetBaseline });
    setCompiledCode(beforeReset);
    setRun(current => current + 1);
    resetRef.current?.focus();
  }
  async function copy() {
    try {
      await navigator.clipboard.writeText(code);
      setCopyStatus("Copied the code shown in the editor.");
    }
    catch {
      setCopyStatus("Clipboard unavailable. Select and copy the code in the editor.");
    }
  }
  return (
    <>
      <header className="playground-heading">
        <span>{example.family}</span>
        <h2>{example.title}</h2>
        <p>{example.description}</p>
        <DocumentationLinks component={example.component ?? example.title} />
      </header>
      <div className="playground-toolbar">
        <label className="example-select">
          Example
          <select ref={selectRef} value={example.id} onChange={event => onExampleChange(event.target.value)}>
            {Array.from(new Set(componentExamples.map(item => item.family))).map(family => (
              <optgroup key={family} label={family}>
                {componentExamples.filter(item => item.family === family).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <ThemeControl value={theme} onChange={value => setCode(changeModuleTheme(code, value))} />
        <label className="width-control">
          Width
          <div>
            <input aria-label="Width" aria-describedby="width-hint" type="range" min="320" max="1000" step="20" value={width} onChange={event => onWidthChange(Number(event.target.value))} />
            <output aria-label="Actual preview width">
              {actualWidth ?? "…"}
              {" px"}
            </output>
          </div>
          <span id="width-hint" className="width-hint">
            {actualWidth !== undefined && actualWidth < width
              ? `Target ${width} px · fitted to panel`
              : "Actual preview width"}
          </span>
        </label>

      </div>
      {outdated
        ? (
            <div className="reset-notice" role="status">
              <span>This example has been updated. Your saved code is kept.</span>
              <button type="button" className="site-button" onClick={reset}>Load updated example</button>
            </div>
          )
        : null}
      {beforeReset !== undefined
        ? (
            <div className="reset-notice">
              <span role="status">Your code before the last reset is available.</span>
              <button type="button" className="site-button" onClick={undoReset}>Undo reset</button>
            </div>
          )
        : null}
      <DocusaurusLiveProvider key={example.id} code={compiledCode} scope={moduleScope} language="jsx" enableTypeScript={false} transformCode={compileModule}>
        <div className="playground-workspace" data-layout={exampleLayout(example)}>
          <section className="editor-panel" aria-label="Code editor">
            <div className="example-bar">
              <span>
                {example.id}
                .jsx
              </span>
              <div className="playground-actions">
                <button className="demo-reset" type="button" ref={resetRef} onClick={reset}>Reset code</button>
                <button className="demo-reset" type="button" onClick={copy}>Copy code</button>
              </div>
            </div>
            <JsxEditor code={code} onChange={setCode} onEscape={() => resetRef.current?.focus()} />
            <CompileStatus pending={code !== compiledCode} />
          </section>
          <section className="live-panel" aria-label="Live preview">
            <div className="example-bar">
              <span>Live preview</span>
              <button className="demo-reset" type="button" onClick={() => setRun(current => current + 1)}>Restart demo</button>
            </div>
            <div className="preview-canvas"><div ref={observeWidth} className="preview-width" style={{ width, maxWidth: "100%" }}><div className="playground-discord"><StablePreview revision={run} /></div></div></div>
          </section>
        </div>
        <CompileError />
      </DocusaurusLiveProvider>
      <div className="playground-help">
        <p id="editor-help">Tab to navigate · Esc to leave the editor or close a thread</p>
        <Link to={`/components?example=${example.id}`}>
          Explore
          {" "}
          {example.title}
        </Link>
      </div>
      <details className="playground-details">
        <summary>About editing and local demos</summary>
        <p className="scope-note">Edit the complete React module: imports, message data and rendering. Drafts stay in this browser tab when you switch examples. Copy code copies exactly this editor. The theme control edits previewTheme in the code. Interactive examples run locally in this browser, without a Discord connection.</p>
      </details>
      <p className="copy-status" role="status">{copyStatus}</p>
    </>
  );
}
