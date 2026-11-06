# Contributing

## Setup

Use **Node 26.x** and **pnpm 12.16.1**, as declared in the root `package.json`.
The Node requirement applies to repository tooling, not browser applications.
With nvm:

```sh
nvm install
nvm use
npm install --global pnpm@12.16.1
pnpm install --frozen-lockfile
pnpm dev
```

The website consumes the built library. Run `pnpm build:lib` after library changes.

## Repository layout

| Path | Purpose |
| --- | --- |
| `packages/discord-ui` | React components, serializable models, themes and compiled CSS |
| `apps/website` | Docusaurus documentation, catalogue and integrated playground |
| `fixtures` | Synthetic data shared by examples and tests |
| `tests/website` | Playwright interaction checks |
| `scripts` | Documentation generation, workspace and distribution checks |
| `.github/workflows` | CI, security scanning, npm publication and Pages deployment |

## Commands and validation

Run commands from the repository root. Choose checks that cover the change:

| Command | Purpose |
| --- | --- |
| `pnpm dev` / `pnpm dev:website` | Build the library and start Docusaurus |
| `pnpm build:lib` | Build library ESM, declarations and CSS |
| `pnpm build:website` | Build the library and production website |
| `pnpm build` | Build all workspace packages |
| `pnpm lint` | Check lint and formatting without editing |
| `pnpm lint:fix` | Apply ESLint fixes |
| `pnpm typecheck` | Check workspace and script types |
| `pnpm test` / `pnpm test:watch` | Run unit/SSR tests once or in watch mode |
| `pnpm test:website` / `pnpm test:browser` | Build and run website Chromium checks |
| `pnpm pack:check` | Verify a built tarball in an isolated consumer |
| `pnpm check` | Run lint, types, unit tests, build and tarball verification |
| `pnpm docs:api` | Build the library and generate API documentation |
| `pnpm docs:api:check` | Check generated API freshness after a library build |
| `pnpm docs:check` | Check API freshness and built documentation links/assets |
| `pnpm generate:avatars` | Regenerate ignored demo avatars from fixture definitions |
| `pnpm clean` | Remove build output and coverage |

Tests importing the public package require `pnpm build:lib` first. Public API or
packaging changes also need `pnpm pack:check` after a build. That check installs
pinned dependencies in a temporary consumer, requires registry access and removes
the temporary directory afterward. It does not publish a package.

For website interactions, install Chromium once with
`pnpm exec playwright install chromium`, then run the affected specs or
`pnpm test:website`. Tests cover desktop and narrow Chromium viewports, not real
mobile devices or cross-browser support. See the
[documentation workflow](./apps/website/docs/project/maintaining-docs.md) for content checks.
For README-only edits, verify links, commands and any changed code examples.

## Change guidelines

Keep changes focused and align public documentation with implemented behavior.
Keep display models serializable, React external to the bundle, and rendering
independent of bot runtimes. Applications own network calls and persistence.
Preserve deterministic SSR, scoped CSS and third-party attribution.

Add regression coverage for behavior and public contract changes. Website examples
use public imports; edit their canonical sources rather than generated previews.
Report checks actually run and distinguish local results from remote CI or deployment.

ESLint with Antfu handles lint and formatting. Husky runs lint-staged before
commits, and commitlint checks Conventional Commits, such as
`feat: add message rendering`. CI does not rely on local hooks having run.

## Maintainer guides

The package remains at `0.0.0` pending its first release. Automation is defined in
the repository; GitHub/npm account configuration must be checked separately.

- [CI and npm releases](./docs/maintainers/releases.md).
- [Website deployment](./docs/maintainers/deployment.md).
- [Website maintenance](./docs/maintainers/website.md).
