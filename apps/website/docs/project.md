---
title: Project
description: Understand Discord UI compatibility, versioning, migration and documentation policies, with clear boundaries for verified integrations.
---

# Project

## Compatibility and limitations

[Read the compatibility and verification boundaries](./project/compatibility.md).

The repository declares React `^19.0.0` as a peer and version `0.0.0` of the package.
See [installation](./installation.md) for workspace consumption. The library uses
ESM and precompiled, scoped CSS. Syntax highlighting has its own opt-in entry point.

Models are resolved display snapshots, not Discord API payloads. The application
owns network access, persistence and authorization. Playground and landing
interactions are local simulations. Narrow Chromium viewport checks do not prove
mobile-device or cross-browser compatibility; SSR tests do not prove every
framework integration.

## Changelog and migration guides

[Read the migration, versioning and URL-continuity policy](./project/migrations.md).

Use the [repository releases](https://github.com/arcscord/discord-ui/releases)
as the destination for release notes when releases are available. Version-specific migration guides and documentation snapshots
will be introduced when maintained releases require them.

## Contributing

[Read the documentation maintenance workflow](./project/maintaining-docs.md).

Work from the repository root using the declared Node and pnpm versions. Useful
commands are `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and
`pnpm build:website`. Website browser checks run with `pnpm test:website`.

Examples consume public package exports and compiled CSS. Edit the canonical
example definitions rather than generated previews. Keep code, documentation and
examples aligned, and distinguish local simulations from real Discord integration.
