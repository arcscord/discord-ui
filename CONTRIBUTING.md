# Contributing

Use Node 26.x and the pnpm version in `packageManager`. Install dependencies with
`pnpm install --frozen-lockfile`, then run `pnpm check` before submitting changes.

ESLint with Antfu handles lint and formatting, including React/TSX. Use
`pnpm lint:fix` to apply corrections. Husky runs lint-staged before commits and
commitlint checks Conventional Commits, for example `feat: add message rendering`.
The CI check does not rely on hooks having run.

Keep React external to the library bundle. Publish compiled ESM, declarations and
scoped CSS; test the tarball rather than relying only on workspace links. Keep the
model serializable and rendering independent of Next.js, Docusaurus and Discord.js.

Add tests for behavior and public contracts. Add browser and SSR coverage when
introducing the first components. New APIs should describe their actual supported
behavior; avoid placeholder exports for unimplemented features.

The public package is version 0.0.0 during bootstrapping. There is no publication
workflow, release automation or configured Git remote yet. Do not add credentials.
Preserve attribution for any adapted third-party code or assets.
