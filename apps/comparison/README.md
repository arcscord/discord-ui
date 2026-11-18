# Framework comparison

Standalone Vite application for manual exploration of native React, Vue and Svelte
Discord UI fixtures. Shared serializable inputs and expected checkpoints live in
`fixtures/comparison/` at the repository root. Each iframe imports its public
framework package and compiled CSS.

## Development

Use the root Node and pnpm versions. Run from the repository root.

```sh
pnpm dev:comparison
```

Open [localhost:4175](http://127.0.0.1:4175/). Vite watches the comparison interface,
native framework sources and shared scenario modules. Rebuild the libraries with
`pnpm build:lib` after changing package sources. Restart the dev command after
changing avatar definitions or the shared font.

Three 390 × 844 viewports share scenario, theme, locale and media settings. Manual
interactions stay independent. Expansion resizes the existing iframe to 1280 px
and preserves its state. The URL stores configuration. Reset clears local state
and callback logs. Diagnostics retain the last 50 native events per preview.

Native fixtures load directly at `/previews/react/`, `/previews/vue/` and
`/previews/svelte/`, accepting scenario, theme, locale and media query parameters.

## Independent build

```sh
pnpm build:comparison
pnpm --filter @arcscord/discord-ui-comparison preview
pnpm test:comparison
```

The deployable directory is **`apps/comparison/dist`**. It contains the comparison
interface, three native fixture documents and their local assets. The build uses
the libraries and sources in this repository. Prepared fonts and avatar assets
are ignored. The font and its license share their canonical source with the
documentation under `apps/website/static/fonts/`.

The initial catalogue covers classic messages, Components V2 and a channel with
a thread. Events and state describe local simulations. Differential image
comparison belongs to the next implementation increment.

## Cloudflare Pages build contract

For a future repository-root Pages build, use `pnpm build:comparison` and select
`apps/comparison/dist` as the output directory. The app uses root-relative URLs
and expects its own origin. The same directory can be uploaded as a tested static
artifact by the future PR publisher.

CI builds and tests the comparison independently of the website browser suite,
and includes its output in the browser-build artifact. Publication configuration
and deployment credentials belong to the future preview-delivery workflow.
