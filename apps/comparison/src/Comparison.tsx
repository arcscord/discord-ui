import type { Framework } from "../../../fixtures/comparison/scenarios";
import { useEffect, useMemo, useRef, useState } from "react";
import { frameworks, parseConfig, scenarios } from "../../../fixtures/comparison/scenarios";
import { ComparisonFrame } from "./components/ComparisonFrame";
import { frameworkNames } from "./previews/protocol";
import "./styles.css";

const previewWidths = [390, 480, 481, 640, 641, 1280];

export default function Comparison() {
  const [search, setSearch] = useState(() => window.location.search);
  useEffect(() => {
    const synchronize = (): void => setSearch(window.location.search);
    window.addEventListener("popstate", synchronize);
    return () => window.removeEventListener("popstate", synchronize);
  }, []);
  const params = new URLSearchParams(search);
  const { config, fallback } = useMemo(() => parseConfig(new URLSearchParams(search)), [search]);
  const requestedFocus = params.get("focus");
  const expanded = frameworks.includes(requestedFocus as Framework)
    ? requestedFocus as Framework
    : null;
  const requestedWidth = Number(params.get("width") ?? 390);
  const previewWidth = previewWidths.includes(requestedWidth)
    ? requestedWidth
    : 390;
  const invalidLayout = Boolean((requestedFocus && requestedFocus !== "all" && !expanded) || (params.has("width") && (previewWidth !== requestedWidth || (expanded !== null && previewWidth !== 1280))));
  const [query, setQuery] = useState("");
  const [resetToken, setResetToken] = useState(0);
  const triggersRef = useRef<Partial<Record<Framework, HTMLButtonElement>>>({});
  const scenario = scenarios.find(entry => entry.id === config.scenario)!;
  const matching = scenarios.filter(entry => `${entry.title} ${entry.description}`.toLowerCase().includes(query.toLowerCase()));

  function update(changes: Record<string, string>): void {
    // Read the current URL so rapid control changes preserve previous settings.
    const current = new URLSearchParams(window.location.search);
    const currentConfig = parseConfig(current).config;
    const currentFocus = current.get("focus");
    const currentExpanded = frameworks.includes(currentFocus as Framework)
      ? currentFocus
      : null;
    const currentWidth = Number(current.get("width") ?? 390);
    const next = new URLSearchParams({
      scenario: currentConfig.scenario,
      theme: currentConfig.theme,
      locale: currentConfig.locale,
      media: currentConfig.allowRemoteMedia ? "allow" : "block",
      focus: currentExpanded ?? "all",
      width: currentExpanded
        ? "1280"
        : String(previewWidths.includes(currentWidth)
            ? currentWidth
            : 390),
      customTheme: currentConfig.customTheme ? "true" : "false",
      ...changes,
    });
    window.history.replaceState(null, "", `${window.location.pathname}?${next}`);
    setSearch(window.location.search);
  }
  function expand(framework: Framework): void {
    const returning = expanded === framework;
    update({
      focus: returning ? "all" : framework,
      width: returning ? "390" : "1280",
    });
    if (returning)
      window.requestAnimationFrame(() => triggersRef.current[framework]?.focus());
  }
  return (
    <main className="comparison-shell">
      <header className="comparison-intro">
        <p className="comparison-eyebrow">React · Vue · Svelte</p>
        <h1>Framework comparison</h1>
        <p>Explore identical fixtures in three independent native previews. Settings apply to all three. Interactions stay local to each preview.</p>
        <p>Manual exploration · Automated results are available in the Playwright report.</p>
      </header>
      {fallback || invalidLayout
        ? <p role="status">Unknown configuration value. Supported defaults are shown below. Changing a control updates the shareable URL.</p>
        : null}
      <div className="comparison-controls">
        <label>
          Search scenarios
          <input type="search" value={query} onChange={event => setQuery(event.target.value)} />
        </label>
        <label>
          Scenario
          <select value={config.scenario} onChange={event => update({ scenario: event.target.value })}>
            {scenarios.filter(entry => matching.includes(entry) || entry.id === config.scenario).map(entry => <option key={entry.id} value={entry.id}>{entry.title}</option>)}
          </select>
        </label>
        <label>
          Theme
          <select value={config.theme} onChange={event => update({ theme: event.target.value })}>
            <option value="light">Light</option>
            <option value="ash">Ash</option>
            <option value="dark">Dark</option>
          </select>
        </label>
        <label>
          Inner viewport width
          <select value={expanded ? 1280 : previewWidth} onChange={event => update({ width: event.target.value, focus: "all" })}>
            {previewWidths.map(width => (
              <option key={width} value={width}>
                {width}
                {" "}
                px
              </option>
            ))}
          </select>
        </label>
        <label className="comparison-checkbox">
          <input
            type="checkbox"
            checked={config.customTheme ?? false}
            onChange={event => update({
              customTheme: String(event.target.checked),
            })}
          />
          Custom theme overrides
        </label>
        <label>
          Locale
          <select value={config.locale} onChange={event => update({ locale: event.target.value })}>
            <option value="en-US">English (US)</option>
            <option value="fr-FR">Français</option>
          </select>
        </label>
        <label className="comparison-checkbox">
          <input
            type="checkbox"
            checked={config.allowRemoteMedia}
            onChange={event => update({
              media: event.target.checked ? "allow" : "block",
            })}
          />
          Allow remote media
        </label>
        <button type="button" onClick={() => setResetToken(value => value + 1)}>Reset all previews</button>
      </div>
      {query
        ? (
            <p role="status">
              {matching.length}
              {" "}
              matching scenarios. The current selection stays available.
            </p>
          )
        : null}
      <section className="comparison-expectations" aria-label="Expected behavior">
        <h2>{scenario.title}</h2>
        <p>{scenario.description}</p>
        <ol>{scenario.checkpoints.map(checkpoint => <li key={checkpoint}>{checkpoint}</li>)}</ol>
      </section>
      <p id="comparison-scroll-help">Scroll horizontally to inspect each fixed-width viewport. Expand a preview for its 1280 px layout.</p>
      <div className="comparison-scroll" role="region" aria-label="Framework previews" aria-describedby="comparison-scroll-help" tabIndex={0}>
        <div
          className="comparison-grid"
          style={{
            gridTemplateColumns: expanded
              ? "1280px"
              : `repeat(3, ${previewWidth}px)`,
          }}
        >
          {frameworks.map(framework => (
            <ComparisonFrame
              key={framework}
              framework={framework}
              config={config}
              resetToken={resetToken}
              expanded={expanded === framework}
              previewWidth={previewWidth}
              hidden={expanded !== null && expanded !== framework}
              onExpand={() => expand(framework)}
              triggerRef={(element) => {
                if (element)
                  triggersRef.current[framework] = element;
              }}
            />
          ))}
        </div>
      </div>
      <p className="comparison-footnote">
        {expanded
          ? `${frameworkNames[expanded]} expanded`
          : "Three previews"}
        {" "}
        · UTC timestamps · Fixed reference time · Local fixture assets · Last 50 events per preview
      </p>
    </main>
  );
}
