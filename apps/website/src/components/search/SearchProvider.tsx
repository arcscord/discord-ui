import type { ReactNode } from "react";
import type { SearchDocument } from "../../data/documentation-search";
import Link from "@docusaurus/Link";
import { useHistory } from "@docusaurus/router";
import { createContext, use, useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { searchDocuments } from "../../data/documentation-search";

function shortcutPlatform(): "mac" | "ctrl" | null {
  const mobile = /Android|iPhone|iPad|iPod|Mobile/iu.test(navigator.userAgent)
    || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    || (navigator.maxTouchPoints > 0 && matchMedia("(pointer: coarse)").matches);
  return mobile
    ? null
    : /Mac/iu.test(navigator.platform)
      ? "mac"
      : "ctrl";
}
function subscribe(listener: () => void) {
  const media = matchMedia("(pointer: coarse)");
  media.addEventListener("change", listener);
  return () => media.removeEventListener("change", listener);
}
const SearchContext = createContext<{ open: () => void; shortcut: "mac" | "ctrl" | null } | null>(null);

export function SearchTrigger() {
  const search = use(SearchContext);
  return (
    <button type="button" className="search-trigger" aria-label="Search documentation" aria-haspopup="dialog" onClick={search?.open}>
      <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true">
        <circle cx="10.5" cy="10.5" r="6.5" />
        <path d="m16 16 4.5 4.5" />
      </svg>
      <span>Search</span>
      {search?.shortcut && (
        <kbd className="search-shortcut">
          {search.shortcut === "mac"
            ? "⌘ K"
            : "Ctrl K"}
        </kbd>
      )}
    </button>
  );
}

export default function SearchProvider({ children }: { children: ReactNode }) {
  const shortcut = useSyncExternalStore(subscribe, shortcutPlatform, () => null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const previousOverflowRef = useRef("");
  const history = useHistory();
  const [documents, setDocuments] = useState<readonly SearchDocument[] | null>(null);
  const [failed, setFailed] = useState(false);
  const loadingRef = useRef(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(-1);
  const results = searchDocuments(documents ?? [], query).slice(0, 8);
  const load = useCallback(async () => {
    if (loadingRef.current)
      return;
    loadingRef.current = true;
    setFailed(false);
    try {
      const index = await import("@generated/local-documentation-search/default/search-index.json");
      setDocuments(index.default);
    }
    catch {
      setFailed(true);
    }
    finally {
      loadingRef.current = false;
    }
  }, []);
  const close = useCallback(() => {
    if (dialogRef.current?.open) {
      dialogRef.current.close();
      document.body.style.overflow = previousOverflowRef.current;
    }
  }, []);
  const open = useCallback(() => {
    if (!dialogRef.current || dialogRef.current.open)
      return;
    previousOverflowRef.current = document.body.style.overflow;
    dialogRef.current.showModal();
    document.body.style.overflow = "hidden";
    setActive(-1);
    inputRef.current?.focus();
    inputRef.current?.select();
    if (!documents)
      void load();
  }, [documents, load]);
  useEffect(() => {
    if (!shortcut)
      return;
    const onKey = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.repeat || event.isComposing || event.altKey || event.shiftKey || event.key.toLowerCase() !== "k")
        return;
      if (shortcut === "mac"
        ? event.metaKey && !event.ctrlKey
        : event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        if (dialogRef.current?.open)
          close();
        else
          open();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [shortcut, open, close]);
  useEffect(() => history.listen(close), [history, close]);
  useEffect(() => () => {
    if (dialogRef.current?.open)
      document.body.style.overflow = previousOverflowRef.current;
  }, []);
  return (
    <SearchContext value={{ open, shortcut }}>
      {children}
      <dialog
        ref={dialogRef}
        className="search-dialog"
        aria-label="Search documentation"
        onCancel={(event) => {
          event.preventDefault();
          close();
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing)
            return;
          if (event.key === "Escape") {
            event.preventDefault();
            event.stopPropagation();
            close();
            return;
          }
          if (event.key === "Tab") {
            const controls = event.currentTarget.querySelectorAll<HTMLElement>("input, button, a[href]");
            const first = controls[0];
            const last = controls[controls.length - 1];
            if (event.shiftKey && event.target === first) {
              event.preventDefault();
              last?.focus();
            }
            else if (!event.shiftKey && event.target === last) {
              event.preventDefault();
              first?.focus();
            }
          }
          if ((event.target === inputRef.current || (event.target as HTMLElement).closest(".quick-search-results")) && (event.key === "ArrowDown" || event.key === "ArrowUp") && results.length) {
            event.preventDefault();
            const next = event.key === "ArrowDown"
              ? (active + 1) % results.length
              : (active <= 0
                  ? results.length - 1
                  : active - 1);
            setActive(next);
            document.getElementById(`quick-result-${next}`)?.focus();
          }
          if (event.target === inputRef.current && event.key === "Enter" && results.length) {
            event.preventDefault();
            const target = results[Math.max(active, 0)];
            close();
            history.push(target.url);
          }
        }}
        onClick={(event) => {
          if (event.target !== event.currentTarget)
            return;
          const bounds = event.currentTarget.getBoundingClientRect();
          if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom)
            close();
        }}
      >
        <div className="search-dialog-heading">
          <label className="search-visually-hidden" htmlFor="quick-search">Search the documentation</label>
          <input
            ref={inputRef}
            id="quick-search"
            type="search"
            placeholder="Search documentation…"
            autoComplete="off"
            value={query}
            aria-describedby="quick-search-status"
            onFocus={() => setActive(-1)}
            onChange={(event) => {
              setQuery(event.target.value);
              setActive(-1);
            }}
          />
          <button type="button" className="search-close" aria-label="Close search" onClick={close}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        <div className="search-dialog-body">
          <p id="quick-search-status" role="status">
            {failed
              ? "Search could not load."
              : !documents
                  ? "Loading search…"
                  : !query.trim()
                      ? "Search guides, components and recipes."
                      : results.length
                        ? `${results.length} results shown`
                        : "No results. Try a shorter query."}
          </p>
          {failed && <button type="button" className="search-retry" onClick={() => { void load(); }}>Retry</button>}
          <ol className="quick-search-results">
            {results.map((result, index) => (
              <li key={result.url}>
                <Link
                  id={`quick-result-${index}`}
                  to={result.url}
                  className={active === index
                    ? "is-active"
                    : undefined}
                  onFocus={() => setActive(index)}
                  onClick={close}
                >
                  <small>
                    {result.category === "api"
                      ? "API reference"
                      : result.category === "recipes"
                        ? "Recipe"
                        : "Documentation"}
                  </small>
                  <span>
                    {result.title}
                    {result.section && ` › ${result.section}`}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <footer className="search-dialog-footer">
          <Link
            to={`/search${query.trim()
              ? `?q=${encodeURIComponent(query.trim())}`
              : ""}`}
            onClick={close}
          >
            Open full search
            <span aria-hidden="true">↗</span>
          </Link>
          {shortcut && <span className="search-shortcut">↑ ↓ navigate · Enter open · Esc close</span>}
        </footer>
      </dialog>
    </SearchContext>
  );
}
