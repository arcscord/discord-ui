---
title: Maintaining documentation
description: Sources, validation and maintenance rules for examples, API pages and local search.
---

# Maintaining documentation

Use the root manifest's Node 26 range and pnpm 12.16.1. The website consumes built
public package exports and compiled CSS. `pnpm dev` and `pnpm build:website` build
the library before the website. Work on canonical sources, not ignored previews.

## Choose the source

| Content | Source |
| --- | --- |
| Guides and recipes | `apps/website/docs` |
| Catalogue/recipe JSX modules | `src/data/component-examples.ts`, `recipe-examples.ts` and `scenarios/` |
| Small typed guide modules | `src/components/docs/guides/` |
| API behavior/field notes and data examples | `scripts/docs/api-metadata.mts`, `model-examples.mts` |
| API extraction | `scripts/docs/generate-api-reference.mts` |
| Shared guide/API destinations | `src/data/component-docs.ts` |
| Navigation | `sidebars.ts`, `docusaurus.config.ts` |
| Search index and ranking | `plugins/documentation-search.ts`, `search-sections.ts`, `src/data/documentation-search.ts` |

Website paths in this table are relative to `apps/website` unless rooted at scripts.
All reusable modules include explicit imports and data when displayed/copied.
Examples using local assets must explain how to copy or replace those assets.

## Keep API and examples aligned

After a public contract change, run `pnpm docs:api`. It builds the library, extracts
signatures/field tables, compiles data examples against built imports and updates
checked-in reference pages and `documentation-api-map.md`. Edit authored notes and
examples when behavior changes. Do not hand-edit generated reference pages.

`pnpm docs:api:check` is read-only and needs a prior library build. Unit coverage
also checks generated output and public component destinations. For a canonical
JSX change, run the website's `generate:examples` command or use dev/build; the
Docusaurus watcher regenerates precompiled previews. Keep generated files ignored.

## Validate a documentation change

Run checks proportional to the affected behavior:

1. Focused example/SSR/search tests and `pnpm typecheck`.
2. `pnpm lint`, `pnpm build:website` and `pnpm docs:check` for syntax, production
   routes, internal links/fragments, local assets and example destinations.
3. Affected Playwright specs through `pnpm exec playwright test -c playwright.website.config.mts`.
4. Inspect relevant themes and a narrow viewport; exercise keyboard, copy and actual
   control behavior rather than validating screenshots alone.

Public export/distribution changes also require packed-consumer checks. Local
passes do not imply remote CI, deployment or live Discord integration.

## Search and navigation checks

Search is built from Docusaurus's public document metadata and source sections.
It excludes draft/unlisted docs, includes guide/API/recipe/project text, and is
loaded by the search route without sending queries to an external service.
Published documentation is public data, not private storage.

The production build checks every indexed page and fragment against rendered HTML
and fails if a search destination is missing. Section headings
inside fenced examples are not indexed as headings. Test ranking, direct query
URLs, empty/no-result states, keyboard activation and narrow layouts after changes.
Keep titles and descriptions specific. Preserve old route/fragment entry points;
see the [migration and version policy](./migrations.md).

The [documentation quality criteria](./documentation-quality.md) define the six
delivery batches and the local acceptance gate.
