# Arcscord Discord UI website

Docusaurus site for the documentation, component catalogue and editable React playground.
Production URL: [ui.arcscord.dev](https://ui.arcscord.dev).

## Development

Use **Node 26.x** and **pnpm 12.16.1**. Run from the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

`pnpm dev` builds the library and starts the site at [localhost:3000](http://127.0.0.1:3000).
Examples import public package exports and compiled CSS. Rebuild with `pnpm build:lib`
after changing library sources.

| Command | Purpose |
| --- | --- |
| `pnpm build:website` | Build the library and production site |
| `pnpm --filter @arcscord/discord-ui-website preview` | Serve the production build |
| `pnpm test:website` | Build and run desktop/narrow Chromium checks |
| `pnpm docs:api` | Build the library and regenerate the API reference |
| `pnpm docs:check` | Check API freshness, links and assets after a production build |

## Where to edit

Paths below are relative to this directory unless they start with `scripts/`.

| Content | Source |
| --- | --- |
| Documentation and guides | `docs/`, `src/components/docs/guides/` |
| First-message preview and copyable source | `src/components/docs/FirstMessage.tsx` |
| Catalogue, recipes and landing scenarios | `src/data/component-examples.ts`, `src/data/recipe-examples.ts`, `src/data/scenarios/` |
| API descriptions and model examples | Root `scripts/docs/api-metadata.mts`, `scripts/docs/model-examples.mts` |
| Playground | `src/pages/playground.tsx`, `src/components/playground/` |
| Framework comparison | `src/pages/compare.tsx`, `src/comparison/`, root `fixtures/comparison/` |
| Navigation, shared links and development notice | `sidebars.ts`, `docusaurus.config.ts`, `src/data/site.ts` |
| Site styles and assets | `src/css/custom.css`, `static/` |

Edit canonical example modules, not ignored files in `src/generated/examples/`.
Dev/build regenerate previews from those modules. Demo interactions are local
simulations; they do not connect to Discord.

## Framework comparison

`/compare` hosts three isolated native fixture documents, initially at 390 × 844
CSS pixels. Shared controls select the scenario, Light/Ash/Dark theme, locale and
remote-media policy. The URL preserves these settings and the expanded preview.
Each preview owns its interactions. Expansion resizes the existing iframe to
1280 px, and Reset all previews clears local state and the last 50 callback events.

The initial catalogue covers a classic message, Components V2 and a channel with
a thread. Expected checkpoints are defined in `fixtures/comparison/scenarios.ts`.
Event/state panels describe local simulation. Automated differential results will
be integrated in a subsequent increment.

The website plugin generates ignored standalone assets under
`static/generated/comparison/` before dev/build and watches the fixture sources
during development. Run `pnpm exec node scripts/workspace/generate-comparison.mts`
from the repository root for standalone generation after `pnpm build:lib`.
Each document also loads directly at `/generated/comparison/<framework>`
and accepts the same scenario, theme, locale and media query parameters.

## Maintenance

- [Documentation workflow](./docs/project/maintaining-docs.md): generation, sources and checks.
- [Playground behavior](./docs/playground.md): imports, copying and draft recovery.
- [Website maintenance](../../docs/maintainers/website.md): assets, search, SEO and local evidence.
- [Deployment](../../docs/maintainers/deployment.md): GitHub Pages and domain setup.
- [Contributing](../../CONTRIBUTING.md): repository setup and validation.
