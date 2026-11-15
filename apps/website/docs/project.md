---
title: Project
description: Understand Discord UI compatibility, versioning, migration and documentation policies, with clear boundaries for verified integrations.
---

# Project

## Compatibility and limitations

[Read the compatibility and verification boundaries](./project/compatibility.md).

The React adapter requires React `^19.0.0` and the Vue adapter requires Vue
`^3.5.0`. See the [React](./installation.md) and [Vue](/docs/vue#installation)
installation guides. Both adapters ship ESM and precompiled, scoped CSS.
Syntax highlighting has its own opt-in entry point.

Models are resolved display snapshots, not Discord API payloads. The application
owns network access, persistence and authorization. Playground and landing
interactions are local simulations. Narrow Chromium viewport checks do not prove
mobile-device or cross-browser compatibility; SSR tests do not prove every
framework integration.

## Changelog and migration guides

[Read the migration, versioning and URL-continuity policy](./project/migrations.md).

Use the [repository releases](https://github.com/arcscord/discord-ui/releases)
for release notes. Version-specific migration guides and documentation snapshots
are added when maintained releases require them.

## Contributing

[Read the documentation maintenance workflow](./project/maintaining-docs.md).

Work from the repository root using the declared Node and pnpm versions. Useful
commands are `pnpm dev`, `pnpm lint`, `pnpm typecheck`, `pnpm test` and
`pnpm build:website`. Website browser checks run with `pnpm test:website`.

Examples consume public package exports and compiled CSS. Edit the canonical
example definitions rather than generated previews. Keep code, documentation and
examples aligned, and distinguish local simulations from real Discord integration.
