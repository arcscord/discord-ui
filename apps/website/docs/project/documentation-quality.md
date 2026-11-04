---
title: Documentation quality criteria
description: Delivery batches, acceptance criteria and repeatable local verification for the documentation.
---

# Documentation quality criteria

Documentation is complete for the implemented public contract when the criteria
below are supported by inspectable source and validation. Keep that claim separate
from publication, deployment, remote CI and real Discord integration.

## Delivery batches

1. **Inventory:** every public export and feature has a destination in the API
   coverage map, navigation and examples.
2. **Getting started:** installation matches the manifests, the first message is
   a complete reusable module, and component choice is explained.
3. **Guides:** every implemented feature has usage, state/behavior notes, a preview
   and explicit application responsibilities.
4. **Reference:** imports, signatures, fields, required/optional status, defaults,
   callbacks, variants and valid examples match the public contracts.
5. **Recipes:** complete scenarios reuse canonical source and work in the catalogue
   and playground, with local simulation boundaries made explicit.
6. **Finalization:** troubleshooting, search, navigation, copying, keyboard and
   responsive behavior are verified together.

## Contract and example criteria

- All public entry points and named exports are covered; a new export requires
  authored behavior notes and a valid example before reference generation succeeds.
- Reusable examples use public imports, explicit data, compiled CSS and visible
  display options. Models remain serializable and callbacks remain host-owned.
- Copied code matches the displayed module; previews and playground modules share
  canonical source. Typed guide/data examples compile and initial SSR is deterministic.
- Classic/V2 constraints, controlled/local state, relative time, private-data and
  network responsibilities are explained accurately.

## Navigation and interaction criteria

- Direct routes, important old fragments, internal links, local assets and example
  deep links resolve against the production build.
- Search results target existing rendered pages/sections; draft/unlisted docs stay
  outside its public index.
- Light/Ash/Dark previews and constrained layouts remain usable. Tables may scroll
  horizontally inside their container; the page must not overflow.
- Buttons, menus, spoilers, composers, thread dismissal and focus restoration work
  through actual interactions. Screenshots supplement keyboard and state checks.
- Copy, editable drafts, reset/undo, error recovery and last valid preview are checked.

## Repeatable verification

Use the declared Node/pnpm versions from the repository root:

```sh
pnpm build:lib
pnpm lint
pnpm typecheck
pnpm test
pnpm build:website
pnpm docs:check
pnpm exec playwright test -c playwright.website.config.mts
```

A prior library build is required for tests using public imports; the website build
also rebuilds it. `docs:check` is read-only and needs the production build and its
example registry. It verifies generated API coverage, internal HTML links/fragments,
local asset references and example IDs/themes. The production build separately
validates all indexed search destinations.

Run a packed-consumer check as well when exports, declarations or distribution
change. This documentation work does not change those package contracts.

## Evidence boundaries

Record the checked working-tree state, commands, outcomes and remaining limitations.
The local completion record is `apps/website/documentation-completion.md`; it is a
maintainer artifact, not a claim of remote CI or release publication. The
[compatibility page](./compatibility.md) separates declarations from tested scopes.

Chromium at desktop and narrow widths is not a real-device, other-browser or
assistive-technology certification. SSR fixtures do not prove universal framework
compatibility. External link availability, hosting/DNS/TLS and actual Discord
transport require their own evidence when they are in scope.

[Maintenance workflow](./maintaining-docs.md) · [Troubleshooting](../troubleshooting.md)
