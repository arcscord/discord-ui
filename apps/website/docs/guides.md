---
title: Guides
description: Learn to render Discord messages, Markdown, embeds, Components V2, reactions, channels and threads through typed React examples.
---

# Guide directory

Each guide explains its display contract, includes a complete typed React module
with a live preview, and links to a realistic editable catalogue example.

## Messages and replies

[Read the messages and replies guide](./guides/messages.mdx).

Use `MessageView` for author, explicit timestamp, body and optional reply metadata. The `edited` field is a boolean; a reply snapshot and a thread summary serve different purposes.

[Inspect the example](/components?example=message) · [Edit in playground](/playground?example=message)

## Markdown, mentions and emoji

[Read the markdown, mentions and emoji guide](./guides/markdown.mdx).

Use `Markdown` for formatted content, or a text body for plain content. Supply entity metadata for mentions. Spoilers can be revealed locally.

[Inspect the example](/components?example=markdown) · [Edit in playground](/playground?example=markdown)

## Embeds

[Read the embeds guide](./guides/embeds.mdx).

Supply an `EmbedView` to `Embed`, or use the classic message’s embeds array. Inspect optional fields and the constrained preview in the catalogue.

[Inspect the example](/components?example=embed) · [Edit in playground](/playground?example=embed)

## Media, galleries and files

[Read the media, galleries and files guide](./guides/media.mdx).

Use `Media` for one asset, `MediaGallery` for several, and `File` for downloadable attachments. Catalogue media uses local example files that must be copied when reusing those examples.

[Inspect the example](/components?example=media-gallery) · [Edit in playground](/playground?example=media-gallery)

## Components V2

[Read the components v2 guide](./guides/components-v2.mdx).

Use a Components V2 body to render a serializable layout. Containers, sections and accessories compose within that body; classic top-level embeds and attachments cannot be mixed into it.

[Inspect the example](/components?example=message-components) · [Edit in playground](/playground?example=message-components)

## Buttons and select menus

[Read the buttons and select menus guide](./guides/interactions.mdx).

Provide handlers for button intent and controlled selections when needed. Menu options are resolved snapshots, including selected entities. See [Interaction state](./public-api.md) for selection semantics.

[Inspect the example](/components?example=select-menu) · [Edit in playground](/playground?example=select-menu)

## Reactions

[Read the reactions guide](./guides/reactions.mdx).

Supply reaction counts and selected state in the model. Handle toggle intent in your application and render an updated snapshot.

[Inspect the example](/components?example=reactions) · [Edit in playground](/playground?example=reactions)

## Channels and message history

[Read the channels and message history guide](./guides/channels.mdx).

Use `ChannelView` for the complete shell or `MessageList` inside your own layout. Message order comes from the supplied array; the application owns adding and loading messages.

[Inspect the example](/components?example=channel-view) · [Edit in playground](/playground?example=channel-view)

## Composer and slash commands

[Read the composer and slash commands guide](./guides/composer.mdx).

Supply commands and handlers to the composer or channel. Invocation reports intent; example responses are local simulations with no Discord connection.

[Inspect the example](/components?example=slash-commands) · [Edit in playground](/playground?example=slash-commands)

## Threads

[Read the threads guide](./guides/threads.mdx).

Supply loaded thread data and the matching parent message. `ThreadPreview` opens a summary; `ThreadPanel` displays the conversation. Thread navigation does not fetch data.

[Inspect the example](/components?example=thread-panel) · [Edit in playground](/playground?example=thread-panel)

## Themes and customization

[Read the themes and customization guide](./guides/themes.mdx).

Set `DiscordUI.theme` to `light`, `ash` or `dark`. Use semantic token overrides or `defineTheme` for a custom theme while preserving inherited values.

[Inspect the example](/components?example=discord-ui) · [Edit in playground](/playground?example=discord-ui)

## Localization and timestamps

[Read the localization and timestamps guide](./guides/localization.mdx).

Use `locale` and `timeZone` for formatting and `labels` for interface text. Provide explicit message timestamps and a stable `referenceTime` for relative timestamps.

[Inspect the example](/components?example=message-timestamp) · [Edit in playground](/playground?example=message-timestamp)

## SSR and hydration

[Read the ssr and hydration guide](./guides/ssr.mdx).

Use the same snapshots, locale, time zone and reference time for server rendering and hydration. Avoid generating timestamps or IDs during rendering.

[Inspect the example](/components?example=message) · [Edit in playground](/playground?example=message)

## Accessibility

[Read the accessibility guide](./guides/accessibility.mdx).

Preserve semantic controls, visible focus and keyboard access when composing primitives. Supply meaningful media alternatives and localized labels; test the complete interaction in your application.

[Inspect the example](/components?example=button) · [Edit in playground](/playground?example=button)
