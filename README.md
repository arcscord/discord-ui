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

## Package layout

- `packages/discord-ui`: publishable ESM library, declarations and CSS.
- `apps/playground`: private Vite application using the package.
- `fixtures`: synthetic scenes shared by the playground and tests.
- `scripts`: small TypeScript CLIs for cleanup and distribution checks.
- `.github/workflows/ci.yml`: same checks as local development.

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
