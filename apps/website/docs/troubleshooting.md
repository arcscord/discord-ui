---
title: Troubleshooting
description: Diagnose styling, media, model, interaction, timestamp and playground problems.
---

# Troubleshooting

Start with the symptom below, then compare the supplied data and props with the
linked guide. The application owns loading, authorization and persistence;
rendering a local preview is not confirmation of a Discord request.

## Styling and media

### Content appears unstyled

Import `@arcscord/discord-ui/styles.css` once through your application's CSS entry
and place primitives inside `DiscordUI`. No Tailwind setup, global reset or remote
font is needed. Build the library after changing its source: the website imports
compiled public exports. Check the selected theme and semantic token overrides
before overriding internal classes. See [installation](./installation.md).

### An image or avatar is missing

Check the actual URL, network response, supplied dimensions and meaningful `alt`.
`allowRemoteMedia={false}` blocks explicit HTTP(S) image sources even on your own
host; accepted root-relative assets remain available. Failed/blocked images show
an unavailable state and avatars use initials. Custom/Unicode emoji follow the
shared media behavior. A spoiled image is not mounted until it is revealed.

Copied examples may depend on `static/examples` assets or generated avatars.
Copy the corresponding files into your public directory or replace their URLs.
Do not edit generated avatar SVGs. See [assets](./playground.md#assets) and
[media policy](./guides/media.mdx#remote-media-policy).

### A file cannot be downloaded

File cards and link buttons require explicit HTTP(S) URLs; relative/unsafe targets
remain inert. Image filtering does not disable outgoing file links. A cross-origin
server/browser may ignore download behavior; the file name is not proof of file
availability. Supply an authorized endpoint and verify it in your application.

## Models and interactions

### TypeScript rejects a body or component tree

Choose one body family. Classic text/Markdown messages permit top-level embeds,
media, attachments and action rows; Components V2 puts its supported layout nodes
inside `body.components` and forbids those classic extra fields. Action rows accept
buttons or one select, not both. Sections require supported text nodes plus an
accessory; containers do not contain other containers. Read the
[contracts](./concepts.md#classic-messages-and-components-v2) and [model reference](./api/models.mdx).

### Clicking does not update the preview

A callback reports intent. Replace the controlled values or display snapshot in
your handler. Reactions require count/me updates; a send handler must append a
message; button clicks do not automatically disable controls or persist approval.
Use the supplied message context when an ID is reused in another message.
See [interactive preview](./recipes/interactive-preview.mdx).

### A select resets, loses a value or does not clear

Missing/undefined value keys allow local state; `[]` is explicitly empty controlled
state. Defaults initialize local state and do not overwrite later user choices.
A changed menu ID/kind resets local state. Include selected entities in externally
loaded/searchable snapshots; unavailable values are filtered. Use `minValues: 0`
when a user may remove the last selected value. Scope values by message ID before
select ID when component IDs repeat. See [controlled selections](./recipes/controlled-selections.mdx).

### A thread does not open or its summary is stale

The starter's `thread.id` must match a loaded thread whose `parentMessageId` points
to that starter in the channel. Unknown IDs do not trigger fetching. When navigation
is controlled, update `activeThreadId` from open/close callbacks; `null` closes it.
Update counts and the last-message summary alongside replies. Hiding the channel
composer does not hide the thread composer. See [channel with threads](./recipes/channel-threads.mdx).

### A draft disappears or history jumps to the bottom

Changing channel/thread identity resets local conversation state. Use a custom
channel composer and an application draft store when needed. With `autoScroll`
enabled, a changed last message ID scrolls to the bottom; resizing follows while
near the bottom. Opt out or compose your own viewport for a different policy.
See [channels](./guides/channels.mdx).

## SSR and timestamps

### A timestamp is invalid or server/client content differs

Use an explicit ISO 8601 instant with `Z` or an offset. Supply the same snapshots,
locale, time zone, labels, entities, theme and reference time on server and client.
Do not create initial IDs or clocks during rendering. Validate locale/time-zone
configuration before calling `Intl`-based formatters. Invalid message dates show
the translated invalid label, not the current time.

Relative Discord timestamp tokens do not tick automatically. Give them a stable
`referenceTime`; standalone Markdown otherwise has an epoch fallback, while the
main Message body uses the wrapper reference or its message timestamp. See
[localization](./guides/localization.mdx) and [SSR](./guides/ssr.mdx).

## Playground behavior

### An import fails or the preview stops changing

The runtime accepts React, the root package, `/themes` and `/styles.css`. It does
not load arbitrary dependencies or the optional `/highlight` module. Keep source
as a complete JSX module with a default React component. Typed guide modules are
intended for a TypeScript application; the playground does not provide TypeScript
diagnostics. It evaluates local browser code and is not a secure sandbox.

Syntax/render errors keep the editor and last successful preview. Correct the
code to recover. Copy code copies the exact current text, including unfinished
edits and errors. See [playground help](./playground.md).

### Reset, reload or incoming examples behave unexpectedly

Restart demo resets component state without changing source. Reset code restores
the canonical example while retaining the selected theme and offers Undo reset.
Drafts are scoped to the current browser tab, with storage-backed reload recovery
when available. An outdated draft is kept until Load updated example is chosen.
Existing saved code takes precedence over incoming first-visit theme defaults.

The width control reports the rendered width, which may be constrained by its panel.
Tab leaves the editor and Escape focuses Reset code. On narrow screens the preview
comes first. These local controls do not sync drafts to Discord or another device.

### Search does not find a page or property

Use a documented English component/property name or fewer words. All query words
must match one indexed section; search is lexical and displays up to 30 results.
Playground edits and private/unpublished source files are not indexed. Rebuild
when documentation changes and verify the actual result URL and fragment.
See [search help](./search.md).
