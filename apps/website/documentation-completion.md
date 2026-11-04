# Documentation delivery and acceptance

Verification date: 2026-11-03 (Europe/Zurich).
Scope: the local, uncommitted working tree based on commit `3fd0579`.
Environment: Node `26.13.0`, pnpm `12.16.1`, Playwright `1.64.1`.

Status: all six delivery batches and the definition of done are accepted locally.
The final results below cover the relevant source in this working tree.

## Delivery batches (plan step 9)

| Lot | Delivered result | Evidence / completion criterion |
| --- | --- | --- |
| 1 — Inventory | Public API coverage matrix and complete sidebar | `documentation-api-map.md`, `documentation-map.md`, `sidebars.ts`; every public export/feature has a destination |
| 2 — Getting started | Four-page path and core contracts | `docs/introduction.mdx`, installation, quick start, component choice and concepts; complete first-message module |
| 3 — Guides | 14 feature guides | `docs/guides/`, typed modules and canonical richer examples; behavior/state/host responsibilities explained |
| 4 — Reference | 141 unique public symbols and four entry points | `docs/api/`, generated signatures/tables, authored notes, valid data/helper examples and freshness checks |
| 5 — Recipes | Seven complete scenarios | Canonical JSX in `src/data/recipe-examples.ts`; same source in recipe previews, catalogue and playground |
| 6 — Finalization | Troubleshooting, local search, maintenance and acceptance | Symptom/cause/action guidance, old route/fragment continuity, public compatibility boundaries and repeatable checks |

The catalogue contains 53 canonical examples covering 34 public React components.
The source/API examples use public entry points. Typed guide modules are checked
for self-contained public imports and CSS; data/helper examples compile against
built public imports. Generated avatars/previews remain ignored.

## Definition of done (plan step 10)

- [x] Every export and contract is documented and generated pages are current.
- [x] Reusable modules use public imports, explicit data and compiled CSS.
- [x] Direct routes, old fragments, internal links, local assets and example IDs/themes resolve.
- [x] Copied source matches the module rendered in previews and playground.
- [x] Relevant Light/Ash/Dark and narrow layouts remain usable.
- [x] Keyboard controls, focus, selection/send/thread behavior and error recovery pass.
- [x] Host responsibilities, local simulations and verification limits are explicit.
- [x] Full local unit and browser suites pass on the final relevant source.

## Recorded final checks

| Command | Result |
| --- | --- |
| `pnpm lint` | Passed |
| `pnpm typecheck` | Passed, including scripts, package and website |
| `pnpm test` | Passed: 195 tests across 19 files |
| `pnpm build:website` | Passed: 51 production HTML pages; all 390 search page/section destinations validated |
| `pnpm docs:check` | Passed: 141 public symbols current; 3,191 internal links, 157 local asset references and 118 example links checked |
| `pnpm exec playwright test -c playwright.website.config.mts` | Passed: all 122 tests, Chromium desktop and narrow viewports |
| `git diff --check` | Passed |

Browser coverage includes direct documentation routes, old fragments, all API
symbol anchors, complete recipe/playground source parity, all three themes,
keyboard/focus, selection scoping, reactions, local sends/replies/commands,
media failure/privacy settings, actual fixture downloads, draft/reset/error
recovery, search and scroll boundaries. Quality-page captures were inspected at
both viewports. No final local check remains blocked.

Acceptance work added a read-only production link/asset/example audit and a
regression test for missing fragments, assets and example IDs. Typed copyable
modules now have a public-import/CSS/default-export guard. Troubleshooting was
expanded from an initial checklist to symptom/cause/action guidance. The CI build
job now runs `pnpm docs:check` after the production build; permissions and deployment
jobs were not changed.

## Evidence boundaries

These are local source/SSR/browser checks. They do not assert commit-specific
remote CI, deployment, DNS/TLS, external-link availability or real Discord
integration. Chromium desktop (1536×1024) and narrow (390×844) viewports do not
prove other browsers, physical mobile devices or assistive technology support.

The package remains at the repository's placeholder `0.0.0`; no release history,
publication or migration between released versions is invented. One documentation
tree is retained until multiple released major versions are maintained.

Library exports, declarations and package distribution were not changed by this
documentation work. Packed-consumer verification is required for such changes;
it is not substituted by website tests or claimed as part of this local sign-off.

## Ongoing checks

`pnpm docs:check` needs a prior production build. It read-only checks generated API
freshness and all rendered internal links/fragments, local asset references and
catalogue/playground example IDs/themes. CI runs it after building documentation.
The build also validates every indexed search destination against rendered HTML.
The workflow change itself is locally reviewed; remote execution is not asserted.

## Search interface follow-up

After the documentation sign-off above, the navbar search became a compact native
modal with a lazily imported local index. The dedicated `/search` page keeps query
deep links and now uses a quieter layout. Desktop shortcuts are ⌘ K on macOS and
Ctrl K on Windows/Linux; detected touch mobile devices register no shortcut and
show no keyboard hint. Arrow keys focus result links, Enter navigates, and Tab
stays inside the dialog. Escape (including from a populated search field), outside
click and the close button restore focus and page scrolling.

Follow-up validation: production build, workspace lint/typecheck, five focused
search unit tests, and 26 Chromium checks across `search-dialog`, `recipes-search`
and `documentation` passed. Standalone website TypeScript also passes with the
generated search index temporarily absent. `docs:check` still validates 51 HTML
pages, 3,191 internal links, 157 local assets and 118 example links. Desktop and
390px captures were inspected. Platform overrides and a touch/mobile user agent
exercise shortcut policy locally; this is not physical-device or Safari testing.
The earlier full-suite totals above remain the documentation baseline, not a
claim that all suites were rerun for this follow-up. No publication or deployment
was performed.

## SEO and identifier search follow-up

Enabled a sitemap for 49 public routes and added robots.txt with its canonical
location. Search is excluded from the sitemap and carries `noindex, follow` in
SSR and client navigation. Eight generic descriptions were replaced with topic
summaries. All pages inherit a local 1200×630 Discord UI sharing image composed
with Arcscord's unchanged wordmark, plus Open Graph/Twitter image descriptions.
Its checked-in generator uses local assets and Playwright Chromium.

Search now matches lowercase concatenated API identifiers (`selectmenu`,
`selectvaluesbymessage`, `onchange`) against camelCase headings and source text,
while preserving all-word matching, exact-heading priority and deterministic
ordering. A fresh development server returned results without index-loading
errors. This change does not claim a reproduced online transport failure.

Validation: production build, workspace lint/typecheck, six search unit tests and
28 Chromium checks across `seo`, `search-dialog` and `recipes-search` passed.
Every sitemap page was checked for unique title/description, canonical URL,
sharing image, H1 and indexability. Search navigation removes its noindex metadata
when opening documentation. Offline failure and Retry recovery were verified at
desktop/narrow viewports. The sharing image was visually inspected. `docs:check`
validated 51 HTML pages, 3,191 internal links, 208 local assets and 118 example
links. The isolated development server was stopped after inspection. These are
local checks; deployment, live crawler access and Google indexing remain outside
this evidence.
