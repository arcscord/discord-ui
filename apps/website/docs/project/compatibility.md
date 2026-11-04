---
title: Compatibility and limitations
description: Declared package requirements and the boundaries of local verification.
---

# Compatibility and limitations

Separate a declared contract from a tested environment. The repository currently
uses a single documentation version for its in-development `0.0.0` package.

| Area | Repository contract / evidence | Limit |
| --- | --- | --- |
| React | Peer range `^19.0.0`; local website uses the installed React 19 dependency | No claim that every peer-range patch or framework is tested |
| Modules | ESM output targeting ES2022; root, themes, highlight and CSS exports | No CommonJS export |
| Styles | Compiled scoped CSS; Light/Ash/Dark and semantic tokens | Hosts must import CSS and review custom contrast/layout |
| SSR | Deterministic fixture rendering with explicit locale, time zone and reference time | Not proof of universal framework or React Server Components integration |
| Browser | Repository tests use Chromium at 1536×1024 and 390×844 | Narrow viewport, not real-device, Safari, Firefox or screen-reader certification |
| Package consumers | `pnpm pack:check` verifies an isolated consumer after a build, with registry access | Documentation/browser tests do not substitute for this distribution check |
| Discord | Resolved display models and intent callbacks | No automatic Discord connection, permission check or send-payload validation |
| Playground | Local JSX evaluation, draft recovery and last valid preview | No secure sandbox or TypeScript diagnostics service |
| Search | Local build-time public documentation index | No external search service, semantic search or unpublished/private document access |

Local build/test results describe the current working tree. They do not establish
that the changes were committed, passed remote CI, or were deployed. The repository
CI workflow builds the library before tests and uploads production browser builds;
inspect that run's results for commit-specific remote evidence.

## Data and transport boundaries

The application owns authorization, entity resolution, persistence, errors and
network requests. Ephemeral/spoiler flags are display behavior. Media filtering
is separate from outgoing-file/link handling. See [core concepts](../concepts.md)
and [media policy](../guides/media.mdx#remote-media-policy).

Keep initial snapshots and display options equal for server rendering and hydration.
Generate real event IDs and times outside rendering; fixed local recipe clocks are
fixtures, not persistent identifiers or delivery confirmation.

## Recheck after a change

For a documentation-only change, run relevant example/SSR tests, typecheck,
`pnpm build:website` and affected browser specs. For exports, declarations or
packaging changes, additionally build the library and verify the packed consumer.
Only report checks that actually ran and distinguish blockers from successes.

[Installation](../installation.md) · [SSR guide](../guides/ssr.mdx) · [Maintenance](./maintaining-docs.md)
