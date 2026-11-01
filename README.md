# Arcscord Discord UI

Independent React/TypeScript library for Discord message interfaces, intended for
AutoThreads and the Arcscord documentation. Package: `@arcscord/discord-ui`.

## Status

Version `0.0.0`, not published. The package currently
exports composable message primitives, serializable types and scoped light/dark styles.
A Vite playground consumes the library. The payload adapter is planned.
A dedicated Docusaurus site in `apps/website` contains the landing, interactive
examples and initial documentation. See [website development](./apps/website/README.md).
No AutoThreads or Arcscord runtime dependency is included.

## Development

Use Node **26.x** and pnpm **12.16.1**. With nvm:

```sh
nvm install
nvm use
npm install --global pnpm@12.16.1
pnpm install --frozen-lockfile
pnpm check
```

The Node requirement applies to repository tooling, not browser applications.
The package targets ES2022 and declares React 19 as a peer. React 18 compatibility
is not currently claimed. Tests cover SSR, content rendering, package installation
and desktop/mobile interactions. Next.js and Docusaurus integration builds are still pending.

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Start the playground with live package updates |
| `pnpm dev:website` | Build the library and start the Docusaurus website |
| `pnpm build:website` | Build the library and production website |
| `pnpm build` | Build all workspace packages |
| `pnpm build:lib` | Build the distributable library |
| `pnpm lint` | Check formatting and lint without editing |
| `pnpm lint:fix` | Apply ESLint fixes |
| `pnpm typecheck` | Check library, tests, config and CLI types |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Watch tests locally |
| `pnpm test:browser` | Build and run desktop/mobile browser checks |
| `pnpm pack:check` | Verify the built tarball in an isolated consumer |
| `pnpm check` | Lint, types, tests, build and tarball verification |
| `pnpm clean` | Remove library, playground, website output and coverage |

Run `pnpm build:lib` before `pnpm pack:check`, or use `pnpm check`. The tarball check
installs pinned consumer dependencies in a temporary directory and needs registry
access. It removes the temporary directory when done. No package is published.
`pnpm dev` starts the playground at http://127.0.0.1:5173. Development uses package
sources with HMR; production builds use the compiled workspace package.
Run `pnpm exec playwright install chromium` once, then `pnpm test:browser` for
desktop and mobile interaction checks. CI runs these checks too.

## Continuous integration

Pull requests, pushes to `main` and manual runs execute separate lint, unit test,
build/typecheck/package and browser jobs. The library, playground and Docusaurus
site are built together; browser jobs reuse those artifacts and test both desktop
and mobile. The independent unit test job builds the library before testing the
website examples, which import its public package exports.
The package check installs the tarball in an isolated consumer and checks
ESM imports, SSR, declarations and CSS. JUnit results, HTML browser reports,
failure screenshots and traces are retained for seven days.

Actions are pinned to commit SHAs, dependency installs use the frozen lockfile and
pnpm store cache, and jobs have timeouts. Superseded PR runs are cancelled.
Configure `CI / Required` as a required status check in the `main` ruleset; it
fails if any constituent job fails, is cancelled or is skipped. CodeQL scans
JavaScript/TypeScript on `main`, PRs targeting `main` and weekly. Use its advanced
setup rather than enabling a second default CodeQL setup.

Dependency review rejects critical vulnerabilities in changed runtime dependencies
on PRs. Dependabot uses the same configuration as
[arcscord/arcscord](https://github.com/arcscord/arcscord/blob/main/.github/dependabot.yml):
production security updates only, grouped together, with `chore` commit prefixes
and `dependencies`/`security` labels. Routine version-update PRs are disabled.
Enable Dependabot alerts and security updates in the repository settings.

## Publish from GitHub

`.github/workflows/publish.yml` publishes `@arcscord/discord-ui` to npm when a
`v*` tag is pushed. It can also be started with **Actions → Publish npm package →
Run workflow**, supplying an existing tag. The tag must match the committed
`packages/discord-ui/package.json` version and point to a commit contained in
`main`; the `0.0.0` placeholder is rejected. Stable versions use the npm `latest`
tag; prereleases such as `v0.2.0-beta.1` use `next`.

The workflow runs the full CI against the resolved release commit, then publishes
the built tarball with provenance. Publication uses the `npm-publish` GitHub
environment. Create this environment and configure reviewers or tag restrictions
as desired before the first release.

Configure an npm [trusted publisher](https://docs.npmjs.com/trusted-publishers/)
for `@arcscord/discord-ui` with organization **arcscord**, repository
**discord-ui**, workflow filename **publish.yml**, environment **npm-publish**,
and permission to publish directly. Subsequent releases authenticate through OIDC.
For the first publication of a package that does not yet have a trusted publisher,
the workflow also accepts an environment secret named `NPM_TOKEN`: use a granular
token with permission to publish under `@arcscord` and bypass 2FA. After that first
release, configure the trusted publisher and remove the token.

To prepare a release, update the library version in a PR and merge it into `main`.
Then tag the merged commit, for example:

```sh
git switch main
git pull --ff-only
git tag v0.1.0
git push origin v0.1.0
```

Creating a new version tag through the GitHub Release form also triggers the
workflow. If the tag already exists, use the manual Actions run instead.
Retrying a failed run or dispatching an existing tag reruns validation;
npm rejects a version that has already been published. Configuration changes alone
do not publish anything.

## Package layout

- `packages/discord-ui`: publishable ESM library, declarations and CSS.
- `apps/playground`: private Vite application using the package.
- `fixtures`: synthetic scenes shared by the playground and tests.
- `scripts`: small TypeScript CLIs for cleanup and distribution checks.
- `.github/workflows`: CI, CodeQL scanning and npm publication.

The initial model separates display metadata from Discord send payloads. It has no
implicit clock, network calls or application-specific configuration. Messages, channels
and threads share serializable display models and composable rendering components.

```ts
import type { MessageView } from "@arcscord/discord-ui";

const message: MessageView = {
  id: "example",
  author: { id: "author", displayName: "Example" },
  timestamp: "2026-10-29T18:00:00Z",
  body: { kind: "text", content: "Hello" },
};
```

The renderer uses `@arcscord/discord-ui/styles.css`. Styles are scoped to
`.arcscord-discord-ui` and `dui-` classes; they include no reset or remote fonts.
Consumers do not need Tailwind.

## Themes

Built-in themes: **light**, **ash**, **dark**. Choose one with `DiscordUI.theme`.
Override individual values with `tokens`, or use `defineTheme` from
`@arcscord/discord-ui/themes` to create a reusable theme extending a preset.
Colors live in `packages/discord-ui/src/styles/themes.css`; components use CSS tokens.
See the [package theme guide](./packages/discord-ui/README.md#themes) for examples
and the preset palette table.

## Content and scope

The playground includes thread summaries and an interactive thread panel with local
replies. Thread cards share the container surface/border; thread data remains editable
in the channel JSON.

The playground includes a channel scene with multiple messages, date separators,
a fixed header/composer and local simulated sending. It opens at the bottom.

The playground includes a live JSON editor for message and channel view models, with syntax
and shape diagnostics, last-valid-preview retention, formatting and copy. It stays
synchronized with the content editor. Reset restores the selected fixture; switching
scenarios loads that fixture. These checks are for display, not Discord publication.

The playground includes plain text, Discord Markdown and entities, keyboard spoilers,
image galleries, embeds and unavailable-media states. The renderer supports controlled emoji reactions and Twemoji rendering; no payload adapter is included. A Components V2 scene demonstrates
containers, sections, thumbnails, galleries, separators and link buttons.

Mentions and custom emoji resources are supplied through `DiscordUI.entities`.
Use `allowRemoteMedia={false}` to block remote avatars, emoji and message/embed
images. Relative timestamps use the message timestamp, or `referenceTime` when
explicitly supplied. Standalone Markdown defaults to a fixed epoch without a clock.

Code highlighting is opt-in: import `renderHighlightedCode` from
`@arcscord/discord-ui/highlight` and pass it as `DiscordUI.renderCode`. The main
entry does not import lowlight or the six grammars. Unknown languages stay escaped
plain text. Supported grammars: JavaScript, TypeScript, JSON, CSS, Bash and Python.

## License and provenance

MIT, copyright 2026 Arcoz0308. Markdown AST rendering and optional highlighting
adapt AutoThreads logic. See `packages/discord-ui/THIRD_PARTY_NOTICES` for provenance
and full dependency/upstream notices. The renderer styles are adapted from AutoThreads and shipped as standalone CSS.
Synthetic SVG fixtures are new.
The notices are included in the package and available from the playground footer.

### Generated demo avatars

`fixtures/avatars.json` stores fixed avatar letters and colors. Both playgrounds
run `scripts/workspace/generate-avatars.mts` before `dev` and `build`, generating
SVG files under their ignored `public/generated/avatars` or
`static/generated/avatars` directories. Use `pnpm generate:avatars` to regenerate
both sets manually. Only the definitions and generator belong in Git.
