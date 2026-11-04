import type { SearchDocument } from "../../data/documentation-search";
import Head from "@docusaurus/Head";
import Link from "@docusaurus/Link";
import { useHistory, useLocation } from "@docusaurus/router";
import useIsBrowser from "@docusaurus/useIsBrowser";
import Layout from "@theme/Layout";
import { useState } from "react";
import { searchDocuments } from "../../data/documentation-search";

export default function SearchPage({ documents }: { documents: readonly SearchDocument[] }) {
  const location = useLocation();
  const history = useHistory();
  const isBrowser = useIsBrowser();
  const requestedQuery = isBrowser
    ? new URLSearchParams(location.search).get("q") ?? ""
    : "";
  const [draft, setDraft] = useState({ source: requestedQuery, value: requestedQuery });
  // Reconcile URL navigation before committing the next render; keep typing local.
  if (draft.source !== requestedQuery)
    setDraft({ source: requestedQuery, value: requestedQuery });
  const query = draft.value;
  const results = searchDocuments(documents, query);
  return (
    <Layout title="Search documentation" description="Search guides, API contracts, recipes and project documentation locally.">
      <Head><meta name="robots" content="noindex, follow" /></Head>
      <main className="docs-search">
        <h1>Search documentation</h1>
        <p>Guides, components, recipes and project notes.</p>
        <form
          role="search"
          onSubmit={(event) => {
            event.preventDefault();
            history.replace({
              pathname: "/search",
              search: query.trim()
                ? `?q=${encodeURIComponent(query.trim())}`
                : "",
            });
          }}
        >
          <label htmlFor="documentation-query">Search the documentation</label>
          <div className="docs-search-controls">
            <input id="documentation-query" type="search" value={query} onChange={event => setDraft({ source: requestedQuery, value: event.target.value })} placeholder="Search documentation…" autoComplete="off" aria-describedby="search-result-count" />
            <button type="submit" className="site-button">Search</button>
          </div>
        </form>
        <p id="search-result-count" role="status">
          {query.trim()
            ? results.length
              ? `${results.length} results (up to 30 shown)`
              : "No results. Try a component name or a shorter query."
            : "Enter a term, such as SelectMenu, threads or controlled selections."}
        </p>
        <ol className="docs-search-results">
          {results.map(result => (
            <li key={result.url}>
              <span>
                {result.category === "api"
                  ? "API reference"
                  : result.category === "recipes"
                    ? "Recipe"
                    : result.category === "guides"
                      ? "Guide"
                      : "Documentation"}
              </span>
              <h2>
                <Link to={result.url}>
                  {result.section
                    ? `${result.title} › ${result.section}`
                    : result.title}
                </Link>
              </h2>
              <p>
                {result.body.slice(0, 210)}
                {result.body.length > 210
                  ? "…"
                  : ""}
              </p>
            </li>
          ))}
        </ol>
        <p>
          <Link to="/docs/introduction">Start with the introduction</Link>
          {" · "}
          <Link to="/docs/api-reference">Browse the API reference</Link>
        </p>
      </main>
    </Layout>
  );
}
