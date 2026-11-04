# Arcscord Discord UI website

Docusaurus app for the landing and documentation. Run from the workspace root:

```sh
pnpm dev
pnpm build:website
pnpm --filter @arcscord/discord-ui-website preview
pnpm test:website
```

Use the workspace's Node 26 and pnpm 12 versions. The library must be built before
starting Docusaurus; `dev` (alias `dev:website`) and `build:website` handle this.

The tab favicon in `static/img/favicon.png` is copied unchanged from Arcscord’s
`website/static/img/favicon.png`. Keep this local copy independent of the sibling
checkout; no remote image request is needed.

The site uses Arcscord's palette and a locally served Inter variable font (see
`static/fonts/OFL.txt`). Discord previews use the package's compiled CSS unchanged.
The font comes from the [official Inter project](https://github.com/rsms/inter/blob/master/docs/font-files/InterVariable.woff2).
Set `site.inDevelopment` in `src/data/site.ts` to `false` to remove the dismissible
development announcement. Shared external destinations live in the same file.

Implemented: shared dark shell, responsive landing with a single Components V2
announcement, a read-only resolved-ticket transcript with a browsable thread, and
a local slash-command arcade (`/dice`, `/quiz`, `/8ball`). Each landing demo has
an independent Light/Ash/Dark selector. Its editor link opens the same scenario
and carries the selected theme for a first visit. Arcade shortcuts prepare commands in the
real composer; responses show the invoking user and command in an interaction
reply. Quiz buttons reveal and lock the answer. `/8ball` responses are ephemeral
and can be dismissed locally. Reset clears the arcade
history and unfinished commands. All responses are local simulations, with fixed
fixture timestamps and no Discord connection. Channel sending and thread replies
remain available in the catalogue and playground. Also included: structured Markdown/MDX
documentation with a four-page getting-started path, `/components` and `/playground`. The explorer covers all 34 public
components with 53 examples and compares Light/Ash/Dark. Deep links use `?example=channel-view`
(or another ID in `src/data/component-examples.ts`).

The editable source in `src/data/component-examples.ts` and
`src/data/scenarios/` is the single example definition. During development, builds,
typechecks and `pnpm test`, `scripts/workspace/generate-website-examples.mts`
precompiles the same standalone modules into ignored `src/generated/examples/`.
The landing imports only its three scenario previews; the catalogue uses the full
registry. It does not evaluate source in the browser. The old parallel rendering
switch, conversation demo and select-menu demo implementations have been removed.
To regenerate manually after changing a source example, run
`pnpm --filter @arcscord/discord-ui-website generate:examples`. The Docusaurus plugin watches canonical source and fixture data during
development and regenerates previews before rebuilding. Source parity tests compare precompiled and live
module rendering, including the Light theme. No preview files should be edited
or committed directly.

The playground loads Docusaurus's live-code provider and JSX compiler on demand.
Its native textarea and Prism overlay support selection, paste, undo and keyboard
focus. Tab leaves the editor; Escape focuses Reset code. Every playground example is
an editable React module: imports, fixture data, the theme constant and the default
component are visible. There are no injected component, hook or fixture bindings.
The local module runtime resolves explicit imports from React, the library,
its theme helpers and its stylesheet. Other module imports produce a clear error.
Copy code copies the exact editor contents, including edits and errors.
The theme toolbar edits the visible `previewTheme` constant. Image examples use
files under `static/examples`; copy them into your app's public directory when
reusing the example.
The preview is a local browser evaluation environment, with no TypeScript
diagnostics. Syntax and render errors keep the editor and last successful preview.
Restart demo resets local component state without editing the source. Reset code
restores the current example while retaining the selected theme, with Undo reset
available. The title and description explain the selected example. Compact
primitives use content-sized previews; conversation examples keep their history
viewport. On narrow screens, the preview comes before the editor.
Each example keeps its code draft in the current browser tab, including across
reloads when session storage is available. When storage is blocked, drafts remain
available while navigating within the site. Drafts carry a source signature;
legacy drafts and drafts based on an older example remain intact, with an explicit
Load updated example action. Loading an update can be undone after a reload.
Reset code offers Undo reset until the next
code edit; both the draft and pending reset recovery survive a reload.
The optional width settings start collapsed on narrow screens and remain expanded
on desktop. Copy feedback appears next to the editor actions. Reset recovery notices
use a brief fade; demo controls respond on press, with reduced-motion alternatives.
The width control reports the rendered preview width and explains when the
requested width is constrained by the panel. The mobile component catalogue starts collapsed and
returns keyboard focus to its browse button after selection.
Embedded channel and thread histories use native scroll chaining: at their top or
bottom boundary, scrolling continues on the page. This site-only override keeps
the library defaults and dropdown scroll containment unchanged.

The documentation sidebar covers Getting started, Core concepts, Guides, API
reference, Recipes, Troubleshooting and Project. The getting-started path, core contracts and 14 feature guides are implemented.
Each guide has a typed standalone module, live preview, exact copyable source and
links to richer catalogue/playground examples. The API reference covers all public symbols with extracted signatures/field tables,
authored behavior/default notes and validated examples. Guides and reference use
the canonical catalogue modules for richer previews and link to the matching
playground. Catalogue/editor headers link back to the guide, API and playground help.
Seven complete canonical recipes and local documentation search are included.
Compatibility, migration/versioning and maintenance policies describe the current
verification boundaries. Major-version snapshots will be introduced only when
multiple released major versions are maintained. The quick-start preview and
its copyable source share `src/components/docs/FirstMessage.tsx`.
Guide previews use `src/components/docs/guides/`; edit these modules to update both
the rendered example and its displayed source. `documentation-map.md` records
the topic coverage and remaining work. npm links point to installation status until
the package is published.

## GitHub Pages deployment

The production address is **https://ui.arcscord.dev**. Docusaurus uses this URL
with `baseUrl: "/"`; do not change it to `/discord-ui/` for this custom domain.

The `Deploy website` workflow in `.github/workflows/pages.yml` runs after `CI`
completes successfully on `main`, following a push or a manual run of `CI`.
Pull requests, other branches and reusable release verification runs do not deploy.
The Pages job downloads the exact `apps/website/build` artifact exercised by the
browser tests, using the successful CI run ID. It does not rebuild or execute
repository code with deployment permissions. The existing reusable CI keeps its
read-only permissions for npm release verification.
Deployments use the `github-pages` environment and the built-in `GITHUB_TOKEN`;
no personal access token, deploy key, `gh-pages` branch or npm publication is needed.

Before the first deployment:

1. In [repository Settings → Pages](https://github.com/arcscord/discord-ui/settings/pages),
   set **Build and deployment → Source** to **GitHub Actions**.
2. Set **Custom domain** to `ui.arcscord.dev` and save it before adding DNS.
   This repository setting is required: a `static/CNAME` file does not configure
   a custom domain for an Actions deployment.
3. In the DNS zone for `arcscord.dev`, add this record (or replace a conflicting
   record for `ui`):

   | Type | Name | Target | TTL |
   | --- | --- | --- | --- |
   | CNAME | `ui` | `arcscord.github.io` | Auto/default |

   The target has no scheme, path or repository name. With Cloudflare, use
   **DNS only** during domain and HTTPS setup.
4. In **Settings → Environments → github-pages**, allow deployments from `main`
   only. Create the environment if it does not exist. Add required reviewers only
   if deployments should require manual approval.
5. Ensure repository/organization Actions policies allow the actions referenced
   in the workflow. Merge the workflow into `main` through the normal review
   process, or run **Actions → CI → Run workflow → main** once it is present.
6. After GitHub validates DNS and provisions the certificate, enable
   **Enforce HTTPS** in Pages settings. Certificate availability can take up to
   an hour after DNS is configured.

For domain ownership verification, use **organization Settings → Pages → Add a
domain** and publish the exact TXT record GitHub supplies. Keep that record after
verification; its value cannot be inferred from the repository.

After deployment, check `dig +short CNAME ui.arcscord.dev` (expected:
`arcscord.github.io.`), then open `/`, `/docs/introduction`, `/components` and
`/playground` directly and reload them. Confirm HTTPS, local fonts/avatars and
interactive previews. The workflow's deployment links to the resulting site;
local builds do not verify GitHub settings, DNS or TLS.

References: [GitHub custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages),
[custom domains](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site),
[domain verification](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/verifying-your-custom-domain-for-github-pages).

The reference concepts are in the design chat's `website-design-plan.md`; their
Discord skins and illustrative snippets are replaced by real package components
and typed data. On mobile, the live preview precedes source code.

`pnpm-workspace.yaml` upgrades Babel's legacy semver dependency to `7.8.5` so
installation keeps `trustPolicy: no-downgrade` enabled without exceptions.

## API reference maintenance

Run `pnpm docs:api` after a public contract change. It builds the library, extracts
public signatures and tables, compiles data/helper examples against the built
public imports, and writes the reference pages and `documentation-api-map.md`.
`pnpm docs:api:check` is read-only and requires a prior library build. Unit tests
also verify checked-in pages and every component/example destination.

Edit `scripts/docs/api-metadata.mts` and `scripts/docs/model-examples.mts` for authored
behavior, field explanations and data examples. New public exports require explicit
coverage. Keep canonical catalogue source in `src/data/component-examples.ts` and
`src/data/scenarios/`; `ReferenceExample` renders the same generated preview and
complete source. Do not edit generated API pages directly (the entry-points page
is authored separately). `src/data/component-docs.ts` shares navigation targets.

## Recipes and local search

Recipe JSX modules live in `src/data/recipe-examples.ts`; their previews, catalogue
source and playground source share the existing canonical generation pipeline.
Dedicated pages under `docs/recipes` explain data preparation, interactions and
application-owned responsibilities. Keep the old recipe directory fragments stable.

The local search plugin consumes Docusaurus public document metadata and source
sections during dev/build. Its index is loaded with `/search` or lazily when opening the search dialog,
not placed in every page's global data. It excludes draft/unlisted documents, searches all query words,
and ranks exact headings first. Lowercase API identifiers such as `selectmenu`
and `selectvaluesbymessage` match their camelCase headings. The compact navbar button opens a native modal dialog, also on narrow screens.
Desktop shortcuts use ⌘ K on macOS and Ctrl K on Windows/Linux; touch mobile
devices show no keyboard hint and register no shortcut. Arrow keys focus actual
result links, Enter opens them, and Escape/outside click closes the dialog and
restores focus. The footer opens `/search?q=…` for the full result list. No third-party service or account is required.

Validate search ranking/extraction with `apps/website/tests/search.test.ts` and
actual routes, anchors, keyboard and recipe interactions with
`tests/website/recipes-search.spec.ts` and `tests/website/search-dialog.spec.ts`. Public documentation is public index data;
playground drafts are not indexed. Production builds validate every indexed page/anchor
against generated HTML. Project policies live under `docs/project`.

## Documentation acceptance

`docs/project/documentation-quality.md` defines delivery batches and the completion
criteria. After a production build, `pnpm docs:check` read-only checks generated API
coverage, every internal HTML link/fragment, local asset references and catalogue/
playground example IDs/themes. External availability and deployment are separate.
The current local evidence and six-batch sign-off live in
`documentation-completion.md`. Keep that record honest about checked commands and
working-tree scope; it does not substitute for commit-specific remote CI.


## SEO and sharing

Docusaurus generates `sitemap.xml` for public pages, excluding `/search` and the
404 route. `static/robots.txt` permits crawling and advertises the canonical
sitemap. Search uses `noindex, follow` without disallowing crawling, so crawlers
can read that directive and still discover documentation links.

All pages inherit the local 1200×630 `static/img/social-card.png` with Open Graph
and Twitter image descriptions. Its composition is specific to Discord UI and
reuses the unchanged `static/img/brand-wordmark.webp` from Arcscord's website.
Regenerate it with `pnpm exec node scripts/docs/generate-social-card.mts` (requires
Playwright Chromium). The image and local font need no remote request.

`tests/website/seo.spec.ts` checks every sitemap destination's canonical URL,
unique title/description, sharing image and indexability, plus search's noindex
behavior during client navigation. Local verification does not establish live
Google indexing, Search Console ownership, server headers or field performance.
