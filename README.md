# Arcscord Discord UI

Independent React/TypeScript library for Discord message interfaces, intended for
AutoThreads and the Arcscord documentation. Package: `@arcscord/discord-ui`.

## Status

Repository foundation only, version `0.0.0`, not published. The package currently
exports serializable message types and scoped CSS tokens. There is no React
renderer, payload adapter or playground yet. These will be added in subsequent iterations.
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
is not currently claimed. Tests currently cover the data contract and package
installation; React rendering compatibility will be checked with the first renderer.

| Command | Purpose |
| --- | --- |
| `pnpm build` | Build all workspace packages |
| `pnpm build:lib` | Build the distributable library |
| `pnpm lint` | Check formatting and lint without editing |
| `pnpm lint:fix` | Apply ESLint fixes |
| `pnpm typecheck` | Check library, tests, config and CLI types |
| `pnpm test` | Run tests once |
| `pnpm test:watch` | Watch tests locally |
| `pnpm pack:check` | Verify the built tarball in an isolated consumer |
| `pnpm check` | Lint, types, tests, build and tarball verification |
| `pnpm clean` | Remove library output and coverage |

Run `pnpm build:lib` before `pnpm pack:check`, or use `pnpm check`. The tarball check
installs pinned consumer dependencies in a temporary directory and needs registry
access. It removes the temporary directory when done. No package is published.
`pnpm dev` will be introduced with the playground, rather than pointing to a missing app.

## Package layout

- `packages/discord-ui`: publishable ESM library, declarations and CSS.
- `scripts`: small TypeScript CLIs for cleanup and distribution checks.
- `.github/workflows/ci.yml`: same checks as local development.

The initial model separates display metadata from Discord send payloads. It has no
implicit clock, network calls or application-specific configuration. Future reactions,
replies and threads will extend this model alongside the rendering components.

```ts
import type { MessageView } from "@arcscord/discord-ui";

const message: MessageView = {
  id: "example",
  author: { id: "author", displayName: "Example" },
  timestamp: "2026-10-29T18:00:00Z",
  body: { kind: "text", content: "Hello" },
};
```

The future renderer will use `@arcscord/discord-ui/styles.css`. This file currently
contains only theme tokens scoped to `.arcscord-discord-ui`; it includes no reset,
remote fonts or component styles. Consumers do not need Tailwind.

## License and provenance

MIT, copyright 2026 Arcoz0308. No renderer code, styles, tests or assets from the
AutoThreads upstream fork are included. Record provenance and include required
notices if third-party fragments are adapted in future work.
