# Website maintenance

Run commands from the repository root. Start with the
[website README](../../apps/website/README.md) and the
[documentation workflow](../../apps/website/docs/project/maintaining-docs.md).

## Examples and generated assets

Canonical JSX modules live under `apps/website/src/data/`:
`component-examples.ts`, `recipe-examples.ts` and `scenarios/`. Dev/build and typechecks regenerate ignored
previews in `apps/website/src/generated/examples/`. To regenerate manually:

```sh
pnpm --filter @arcscord/discord-ui-website generate:examples
```

Guide previews use `apps/website/src/components/docs/guides/`; the first-message
preview and displayed source share
`apps/website/src/components/docs/FirstMessage.tsx`.
The catalogue and landing render precompiled previews; the playground evaluates
editable modules locally. See [playground behavior](../../apps/website/docs/playground.md)
for supported imports, assets and recovery behavior.

`fixtures/avatars.json` defines fixed avatar letters and colors. Dev/build run
`scripts/workspace/generate-avatars.mts`, writing ignored SVGs under
`apps/website/static/generated/avatars/`. Use `pnpm generate:avatars` to regenerate
manually; commit definitions and generators, not generated SVGs.

## Branding and fonts

Paths in this section are relative to `apps/website`.
The favicon (`static/img/favicon.png`) and wordmark (`static/img/brand-wordmark.webp`)
are local copies from Arcscord's website. Keep them independent of the sibling checkout.
The shell uses Arcscord's palette and locally served Inter; preserve the font
license in `static/fonts/OFL.txt`. Discord previews use the library's compiled CSS
unchanged. Keep site-only layout and history scroll-chaining overrides out of the library.

Shared destinations and the dismissible development notice live in
`src/data/site.ts`. Set `site.inDevelopment` to `false` when removing that notice.

## Search and documentation checks

API behavior notes and model examples live in `scripts/docs/api-metadata.mts`
and `scripts/docs/model-examples.mts`. Run `pnpm docs:api` after public contract
changes. The generated reference is checked in; preview modules are ignored.

Local search indexes public documentation and loads the index on demand. Drafts
from the playground are not indexed. Validate extraction/ranking with
`apps/website/tests/search.test.ts`; keyboard, routes and recipe interactions use
`tests/website/recipes-search.spec.ts` and `tests/website/search-dialog.spec.ts`.

After a production build, `pnpm docs:check` checks generated API coverage,
internal links/fragments, assets and catalogue/playground destinations.
[Documentation quality](../../apps/website/docs/project/documentation-quality.md)
defines acceptance criteria. The coverage map and local evidence records live in
`apps/website/documentation-map.md`, `documentation-api-map.md` and
`documentation-completion.md`. They do not replace commit-specific remote CI results.

## SEO and sharing

Paths below are relative to `apps/website`, except root scripts and tests.

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
