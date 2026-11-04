---
title: Changelog and migration policy
description: Release notes, public contract changes and when to snapshot documentation.
---

# Changelog and migration policy

The repository declares `0.0.0` and keeps one current documentation tree. It does
not contain historical version snapshots or a release-to-release migration guide.
Use [repository releases](https://github.com/arcscord/discord-ui/releases) as the
release-note destination when published releases are available; this page does not
claim that a release has been published.

## When a public contract changes

Record the concrete old/new behavior, affected exports and consumer action. A
migration guide should name the released versions it connects, show complete valid
before/after imports and data, and describe controlled-state, styling or SSR
implications where relevant. Do not invent historical behavior or compatibility.

Preserve compatibility unless a breaking change is in scope. Keep display models
separate from send payloads and any application-specific adapters. Consumer
migrations in other repositories require scope covering those repositories.

Update authored metadata/examples, rebuild and regenerate the API reference with
`pnpm docs:api`. Verify source parity, type-level constraints, the packed consumer
when distribution changes, and affected browser interactions. Link release notes
to a migration page only when that page describes an actual released transition.

## When to introduce versioned documentation

Keep one tree while a single current line is documented. When multiple released
major versions are actively supported, snapshot the released documentation through
Docusaurus and label the current development tree clearly. Confirm versioned routes,
sidebar, cross-links and search results before publishing the snapshot.

Do not snapshot placeholder `0.0.0` as a supported release. Version snapshots are
created from verified release content, not from unfinished working-tree changes.
The local search plugin consumes Docusaurus document permalinks; each future
version must still be checked for correct result destinations and version labels.

## URL continuity

Keep existing routes and fragments stable where possible. This documentation
retains `/docs/public-api` for interaction state, plus directory fragments under
`/docs/guides`, `/docs/recipes`, `/docs/api-reference` and `/docs/project`. Dedicated
pages are linked from those directories. If a future move removes a route, add
and test an explicit redirect and retain important old fragment targets.

[Compatibility](./compatibility.md) · [Maintaining documentation](./maintaining-docs.md)
