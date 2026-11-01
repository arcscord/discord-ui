import type { ThemeName } from "@arcscord/discord-ui";
import { DiscordUI } from "@arcscord/discord-ui";
import Link from "@docusaurus/Link";
import { useHistory, useLocation } from "@docusaurus/router";
import useIsBrowser from "@docusaurus/useIsBrowser";
import CodeBlock from "@theme/CodeBlock";
import Layout from "@theme/Layout";
import { useEffect, useRef, useState } from "react";
import { Arrow } from "../components/Arrow";
import { ComponentSample } from "../components/ComponentSample";
import { ThemeControl } from "../components/ThemeControl";
import { componentExamples, playgroundUrl } from "../data/component-examples";
import { previewEntities } from "../data/live-scope";
import { previewThemes } from "../data/preview-themes";

export default function Components() {
  const location = useLocation();
  const history = useHistory();
  const isBrowser = useIsBrowser();
  const requested = isBrowser
    ? new URLSearchParams(location.search).get("example")
    : "message";
  const selected = componentExamples.some(item => item.id === requested)
    ? requested
    : "message";
  const [query, setQuery] = useState("");
  const [theme, setTheme] = useState<ThemeName>("dark");
  const [compare, setCompare] = useState(false);
  const [browseOpen, setBrowseOpen] = useState(false);
  const browseRef = useRef<HTMLButtonElement>(null);
  const restoreBrowseFocusRef = useRef(false);
  const example = componentExamples.find(item => item.id === selected)!;
  const matching = componentExamples.filter(item => `${item.title} ${item.family}`.toLowerCase().includes(query.toLowerCase()));
  const families = Array.from(new Set(matching.map(item => item.family)));
  useEffect(() => {
    if (!restoreBrowseFocusRef.current)
      return;
    // Route navigation manages focus too; restore it after the new page commits.
    const frame = window.requestAnimationFrame(() => {
      restoreBrowseFocusRef.current = false;
      browseRef.current?.focus();
    });
    return () => window.cancelAnimationFrame(frame);
  }, [selected, browseOpen]);
  function choose(id: string) {
    restoreBrowseFocusRef.current = window.matchMedia("(max-width: 640px)").matches;
    if (id !== selected)
      history.push({ pathname: "/components", search: `?example=${id}` });
    setBrowseOpen(false);
  }
  return (
    <Layout title="Components" description="Explore the Arcscord Discord UI components, compare their themes, and open runnable React examples.">
      <main className="explorer-shell">
        <aside
          className="explorer-sidebar"
          aria-label="Component explorer"
          onKeyDown={(event) => {
            if (event.key === "Escape" && browseOpen) {
              event.preventDefault();
              setBrowseOpen(false);
              browseRef.current?.focus();
            }
          }}
        >
          <h1>Components</h1>
          <button className="explorer-toggle" type="button" ref={browseRef} aria-expanded={browseOpen} aria-controls="explorer-navigation" onClick={() => setBrowseOpen(open => !open)}>
            <span>Browse components</span>
            <span>
              {example.title}
              {" "}
              <span aria-hidden="true">{browseOpen ? "−" : "+"}</span>
            </span>
          </button>
          <div id="explorer-navigation" className="explorer-navigation" data-open={browseOpen}>
            <label htmlFor="component-search">Find a component</label>
            <input id="component-search" type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search components…" />
            <nav aria-label="Component families">
              {families.map(family => (
                <div key={family}>
                  <h2>{family}</h2>
                  {matching.filter(item => item.family === family).map(item => (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={selected === item.id
                        ? "page"
                        : undefined}
                      onClick={() => choose(item.id)}
                    >
                      {item.title}
                    </button>
                  ))}
                </div>
              ))}
              {matching.length === 0
                ? <p role="status">No components found.</p>
                : null}
            </nav>
          </div>
        </aside>
        <div className="explorer-content">
          <header className="explorer-heading">
            <span>{example.family}</span>
            <h2>{example.title}</h2>
            <p>{example.description}</p>
          </header>
          <div className="explorer-toolbar">
            {compare
              ? <p className="comparison-note">Showing Light, Ash and Dark</p>
              : <ThemeControl value={theme} onChange={setTheme} />}
            <label className="compare-toggle">
              <input type="checkbox" checked={compare} onChange={event => setCompare(event.target.checked)} />
              Compare all themes
            </label>
          </div>
          <div className={compare ? "theme-comparison" : "single-theme"}>
            {(compare
              ? previewThemes
              : [theme]).map(value => (
              <section className="component-preview" key={`${example.id}-${value}`} aria-label={`${value} preview`}>
                <div className="example-bar">{value[0]!.toUpperCase() + value.slice(1)}</div>
                <DiscordUI theme={value} locale="en-US" timeZone="UTC" entities={previewEntities} className="component-sample"><ComponentSample id={example.id} theme={value} /></DiscordUI>
              </section>
            ))}
          </div>
          <div className="explorer-source-heading">
            <h3>React example</h3>
            <Link to={playgroundUrl(example.id)}>
              Open in playground
              <Arrow />
            </Link>
          </div>
          <p className="scope-note">Open the complete example in the playground to edit its imports, demo data and rendering.</p>
          <CodeBlock language="jsx" title={`${example.id}.jsx`}>{example.code}</CodeBlock>
        </div>
      </main>
    </Layout>
  );
}
