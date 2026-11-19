import type { ComparisonConfig, Framework } from "../../../../fixtures/comparison/scenarios";
import type { ConfigureMessage, NativeEvent, Snapshot } from "../previews/protocol";
import { useEffect, useRef, useState } from "react";
import { frameworkNames, isFrameMessage, protocol } from "../previews/protocol";

type FrameState = { status: "loading" | "ready" | "error"; error?: string | undefined; state?: Snapshot; events: NativeEvent[] };

export function ComparisonFrame({ framework, config, resetToken, expanded, previewWidth, hidden, onExpand, triggerRef }: {
  framework: Framework;
  config: ComparisonConfig;
  resetToken: number;
  expanded: boolean;
  previewWidth: number;
  hidden: boolean;
  onExpand: () => void;
  triggerRef: (element: HTMLButtonElement | null) => void;
}) {
  const frameRef = useRef<HTMLIFrameElement>(null);
  const revisionRef = useRef(0);
  const previousRef = useRef({ scenario: config.scenario, resetToken });
  const sendRef = useRef<() => void>(() => {});
  const [result, setResult] = useState<FrameState>({ status: "loading", events: [] });
  const [dimensions, setDimensions] = useState({ width: 390, height: 844 });
  const name = frameworkNames[framework];
  const width = expanded ? 1280 : previewWidth;

  useEffect(() => {
    const frame = frameRef.current!;
    const observer = new ResizeObserver(() => {
      if (frame.clientWidth)
        setDimensions({ width: frame.clientWidth, height: frame.clientHeight });
    });
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const frame = frameRef.current!;
    const currentRevision = ++revisionRef.current;
    const reset = currentRevision === 1 || previousRef.current.scenario !== config.scenario || previousRef.current.resetToken !== resetToken;
    previousRef.current = { scenario: config.scenario, resetToken };
    setResult(current => ({
      ...current,
      status: "loading",
      error: undefined,
      events: reset
        ? []
        : current.events,
    }));
    const message: ConfigureMessage = {
      protocol,
      framework,
      revision: currentRevision,
      type: "configure",
      config,
      reset,
    };
    function send(): void {
      frame.contentWindow?.postMessage(message, window.location.origin);
    }
    sendRef.current = send;
    const timeout = window.setTimeout(() => setResult(current => ({ ...current, status: "error", error: "The native preview did not acknowledge its configuration within 20 seconds." })), 20_000);
    function receive(event: MessageEvent<unknown>): void {
      if (event.source !== frame.contentWindow || event.origin !== window.location.origin || !isFrameMessage(event.data) || event.data.framework !== framework)
        return;
      const data = event.data;
      if (data.type === "ready") {
        send();
        return;
      }
      if (data.revision !== currentRevision)
        return;
      if (data.type === "error") {
        window.clearTimeout(timeout);
        setResult(current => ({ ...current, status: "error", error: data.error }));
      }
      if (data.type === "applied") {
        window.clearTimeout(timeout);
        setResult(current => ({ ...current, status: "ready", state: data.state }));
      }
      if (data.type === "event") {
        setResult(current => ({
          ...current,
          state: data.state,
          events: [...current.events, data.event].slice(-50),
        }));
      }
    }
    window.addEventListener("message", receive);
    send();
    return () => {
      window.clearTimeout(timeout);
      window.removeEventListener("message", receive);
    };
  }, [config, resetToken, framework]);

  return (
    <section className="comparison-panel" aria-label={`${name} preview`} hidden={hidden} data-framework={framework} data-status={result.status}>
      <header className="comparison-panel-heading">
        <div>
          <h2>{name}</h2>
          <span>
            {dimensions.width}
            {" "}
            ×
            {" "}
            {dimensions.height}
            {" "}
            CSS px
          </span>
        </div>
        <button type="button" ref={triggerRef} aria-expanded={expanded} aria-controls={`${framework}-viewport`} onClick={onExpand}>
          {expanded
            ? "Return to three previews"
            : `Expand ${name}`}
        </button>
      </header>
      <p role="status">
        {result.status === "ready"
          ? "Loaded — local simulation"
          : result.status === "loading"
            ? "Loading native preview…"
            : "Preview failed"}
      </p>
      {result.error
        ? <p role="alert">{result.error}</p>
        : null}
      <iframe id={`${framework}-viewport`} ref={frameRef} title={`${name} comparison fixture`} src={`/previews/${framework}/`} width={width} height={844} onLoad={() => sendRef.current()} />
      <details className="comparison-diagnostics" open>
        <summary>
          Local state and native events (
          {result.events.length}
          )
        </summary>
        <h3>Observable state</h3>
        <pre aria-label={`${name} observable state`}>
          {result.state
            ? JSON.stringify(result.state, null, 2)
            : "Waiting for configuration"}
        </pre>
        <h3>Native events</h3>
        <pre aria-label={`${name} native events`}>
          {result.events.length
            ? result.events.map(event => JSON.stringify(event)).join("\n")
            : "No events"}
        </pre>
      </details>
    </section>
  );
}
