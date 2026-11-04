---
title: Using the playground
description: Supported React modules, local previews, source copying and draft recovery.
---

# Using the playground

The [catalogue](/components?example=message) renders precompiled examples from the
canonical source modules. The [playground](/playground?example=message) evaluates
editable copies of those modules in the browser. Guides explain usage; the
[API reference](./api-reference.md) describes signatures and behavior.

## Choose and edit an example

Use `?example=<id>` links to open a specific catalogue example. A valid `theme`
query parameter seeds a first visit, for example
[the message example in Light](/playground?example=message&theme=light). Existing
saved drafts retain their code and theme.

Every example includes explicit imports, data, a `previewTheme` constant and a
default React component. Change the code to explore behavior. The theme toolbar
edits the visible constant. The width control reports the actual constrained
preview width, which may be smaller than the requested width.

## Supported modules and errors

Runtime imports support `react`, `@arcscord/discord-ui`,
`@arcscord/discord-ui/themes` and `@arcscord/discord-ui/styles.css`. Other module
imports produce an error; the optional `/highlight` runtime is not included.
Playground source uses JSX without TypeScript diagnostics. Copy typed guide
modules into a TypeScript application instead of expecting type checking here.

The editor evaluates local browser code; it is not a secure sandbox. Syntax and
render errors keep the input and last successful preview. Edit the broken code to
recover. Copy code copies the exact current editor text, including errors and
unfinished edits. It does not reconstruct the original example.

## Drafts, restart and reset

Drafts are kept per example in the current browser tab. Session storage preserves
them across reloads when available; blocked storage still permits in-memory
navigation recovery. These are local drafts, not account synchronization.

Restart demo resets local component state without editing code. Reset code restores
the example while retaining its selected theme, and offers Undo reset until the
next edit. Draft and pending reset recovery can survive reloads. When canonical
source changes, the old draft remains available; Load updated example explicitly
replaces it and can be undone.

## Keyboard and narrow layouts

The source editor is a native textarea: selection, paste, undo and navigation
remain available. Tab leaves the editor; Escape focuses Reset code. On narrow
screens, the preview comes before source. The collapsed component browser restores
focus to its browse button after selecting an example. Embedded channel/thread
controls keep their own keyboard behavior.

## Assets

Examples may reference `/examples/*` and `/generated/avatars/*`. Copy corresponding
assets into your application's public directory or replace those URLs. The example
landscape, emoji and JSON fixture live under `apps/website/static/examples`.
Generated avatars come from `fixtures/avatars.json` through `pnpm generate:avatars`;
edit definitions/generation inputs instead of generated SVGs.

File cards require explicit HTTP(S) URLs. Adapt fixture file endpoints to your
application host as needed. The shared image policy differs from outgoing-file
links; see [media handling](./guides/media.mdx#remote-media-policy).

All interactions shown here are local simulations. The application must supply
real data, authorization, persistence and any Discord requests.
