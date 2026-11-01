import Link from "@docusaurus/Link";
import { useHistory, useLocation } from "@docusaurus/router";
import DocusaurusLiveProvider from "@docusaurus/theme-live-codeblock/lib/theme/Playground/Provider/index.js";
import { useEffect, useRef, useState } from "react";
import { componentExamples, getExample } from "../../data/component-examples";
import { ThemeControl } from "../ThemeControl";
import { changeModuleTheme, exportCode, readModuleTheme } from "./export-code";
import { JsxEditor } from "./JsxEditor";
import { compileModule, moduleScope } from "./module-runtime";
import { CompileError, CompileStatus, StablePreview } from "./StablePreview";

export default function PlaygroundEditor() {
  const location = useLocation();
  const history = useHistory();
  const example = getExample(new URLSearchParams(location.search).get("example"));
  const [code, setCode] = useState(() => exportCode(example.code, "dark"));
  const [compiledCode, setCompiledCode] = useState(() => exportCode(example.code, "dark"));
  const theme = readModuleTheme(code);
  const [width, setWidth] = useState(760);
  const [revision, setRevision] = useState(0);
  const [copyStatus, setCopyStatus] = useState("");
  const resetRef = useRef<HTMLButtonElement>(null);
  const lastIdRef = useRef(example.id);
  useEffect(() => {
    if (lastIdRef.current !== example.id) {
      lastIdRef.current = example.id;
      setCode(exportCode(example.code, "dark"));
      setCompiledCode(exportCode(example.code, "dark"));
      setRevision(current => current + 1);
      setCopyStatus("");
    }
  }, [example.id, example.code]);
  useEffect(() => {
    const timeout = window.setTimeout(setCompiledCode, 300, code);
    return () => window.clearTimeout(timeout);
  }, [code]);
  function reset() {
    setCode(exportCode(example.code, "dark"));
    setCompiledCode(exportCode(example.code, "dark"));
    setRevision(current => current + 1);
    setCopyStatus("");
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
      <div className="playground-toolbar">
        <label className="example-select">
          Example
          <select value={example.id} onChange={event => history.replace({ pathname: "/playground", search: `?example=${event.target.value}` })}>
            {Array.from(new Set(componentExamples.map(item => item.family))).map(family => (
              <optgroup key={family} label={family}>
                {componentExamples.filter(item => item.family === family).map(item => (
                  <option key={item.id} value={item.id}>
                    {item.id === "channel-view"
                      ? "Support channel"
                      : item.title}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
        </label>
        <ThemeControl value={theme} onChange={value => setCode(current => changeModuleTheme(current, value))} />
        <label className="width-control">
          Width
          <div>
            <input type="range" min="320" max="1000" step="20" value={width} onChange={event => setWidth(Number(event.target.value))} />
            <output>
              {width}
              px
            </output>
          </div>
        </label>
        <div className="playground-actions">
          <button className="site-button" type="button" ref={resetRef} onClick={reset}>Reset</button>
          <button className="site-button primary" type="button" onClick={copy}>Copy code</button>
        </div>
      </div>
      <DocusaurusLiveProvider key={`${example.id}-${revision}`} code={compiledCode} scope={moduleScope} language="jsx" enableTypeScript={false} transformCode={compileModule}>
        <div className="playground-workspace">
          <section className="editor-panel" aria-label="Code editor">
            <div className="example-bar">
              {example.id === "channel-view"
                ? "support-channel"
                : example.id}
              .jsx
            </div>
            <JsxEditor code={code} onChange={setCode} onEscape={() => resetRef.current?.focus()} />
            <CompileStatus />
          </section>
          <section className="live-panel" aria-label="Live preview">
            <div className="example-bar">
              Live preview
              <span>{example.title}</span>
            </div>
            <div className="preview-canvas"><div className="preview-width" style={{ width, maxWidth: "100%" }}><div className="playground-discord"><StablePreview /></div></div></div>
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
      <p className="scope-note">Edit the complete React module: imports, message data and rendering. Copy code copies exactly this editor. The theme control edits previewTheme in the code.</p>
      <p className="copy-status" role="status">{copyStatus}</p>
    </>
  );
}
