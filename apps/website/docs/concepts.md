---
title: Core concepts
description: Display contracts, message body families, entity identity and application-owned state.
---

# Core concepts

A Discord UI model is a resolved display snapshot. Components render that snapshot
and expose interaction intent. Keep transport, authorization and persistence in
the host application.

## Display models and application responsibilities

| Library | Application |
| --- | --- |
| Render messages, content and loaded conversations | Fetch and normalize source data into display models |
| Apply scoped styles and display options | Supply authors, entity metadata, IDs and explicit timestamps |
| Offer local UI state such as spoiler reveal | Decide what each viewer is allowed to receive |
| Report interaction callbacks | Update controlled values and message/channel snapshots |
| Format supplied dates and counts | Persist data, reconcile server errors and call Discord if needed |

For example, `ChannelView.onSend(content)` does not append a message. Your handler
creates a new message snapshot, updates the channel state and optionally performs
an application request. A reaction callback likewise does not change the supplied
count. See [channels](./guides/channels.mdx) and [reactions](./guides/reactions.mdx).

Display models are **not Discord send payloads**. They may contain resolved display
names, avatar URLs, reply snapshots, reaction counts and loaded thread context that
a send payload does not provide. The library exports no send-payload adapter or
Discord client. Normalize data at your own boundary and validate untrusted input
there; TypeScript types do not validate JSON at runtime.

`ephemeral` describes appearance. Spoilers conceal UI. Neither feature authorizes
access to the underlying data. Filter private content before returning it to a
viewer and enforce authorization in your application.

## Classic messages and Components V2

`MessageView` combines `MessageMetadata` with a discriminated `MessageContentView`
and an optional thread summary. Metadata contains string identity, author, explicit
timestamp, and optional reactions/reply/edited/ephemeral fields.

| Body | Required content | Allowed classic top-level extras |
| --- | --- | --- |
| `{ kind: "text", content }` | Escaped plain string | `embeds`, `media`, `attachments`, action-row `components` |
| `{ kind: "markdown", content }` | Discord-oriented Markdown string | Same classic extras |
| `{ kind: "components-v2", components }` | V2 component tree inside the body | None of those four fields |

These are data fragments illustrating the union; the complete rendering modules
are in the [message](./guides/messages.mdx) and [V2](./guides/components-v2.mdx) guides.

```ts
import type { MessageView } from "@arcscord/discord-ui";

const metadata = {
  id: "example",
  author: { id: "bot", displayName: "Preview Bot", bot: true },
  timestamp: "2026-11-01T10:24:00Z",
};

const classic = {
  ...metadata,
  body: { kind: "text", content: "A classic message" },
  embeds: [
    { id: "details", description: "Optional classic content" }
  ],
} satisfies MessageView;

const v2 = {
  ...metadata,
  body: {
    kind: "components-v2",
    components: [
      { id: "intro", kind: "text-display", content: "A V2 message" }
    ],
  },
} satisfies MessageView;
```

Do not add `embeds`, `media`, `attachments` or top-level `components` to `v2`.
TypeScript deliberately forbids the mixed shape. Move supported content into V2
nodes, or choose a classic body. Classic `components` accepts action rows; it is
not another place for the full V2 tree.

`edited?: boolean` shows a marker without requiring an edit date. `reply` can be a
resolved original, an unavailable original or an interaction invocation snapshot.
`thread` is a separate summary. A loaded thread belongs in the channel's threads
collection, with replies excluding the starter and excluding nested thread summaries.

## Entities and identifiers

All IDs are strings. Use stable message, thread, component and field IDs rather
than array indexes when snapshots can reorder. Component IDs must be unique within
one message and may repeat in different messages. Scope interaction state by the
pair of message ID and component ID.

`DiscordUI.entities` resolves mention/emoji tokens using lookup maps. For example,
`users: { "123456789012345678": { name: "Sam" } }` supplies a mention name. It is different from
a user-select entity, which requires `entityType: "user"`, `id` and `displayName`.
The library does not infer these snapshots from a guild ID or fetch absent entities.

Select-menu entities must include currently selected entities as well as possible
choices. External search results are not necessarily a complete resolved snapshot:
merge selected entities into them. Values omitted from the available choices are
filtered from display and future callbacks. See [buttons and selects](./guides/interactions.mdx).

Models contain serializable display data. Callbacks and custom React nodes belong
in component props, not in the stored model. `DisplayOptions`, for example, is a
configuration type that may contain a `renderCode` callback; it is not a serialized
message snapshot.

Model arrays accept `readonly` inputs, including `as const` fixtures. Treat the
snapshot as immutable: create a new array or object when adding/removing content.
Never mutate shared fixture data in place. Stable inputs also make server rendering
and client hydration easier to reproduce.

## Controlled and local state

| State | Ownership and reset behavior |
| --- | --- |
| Spoiler reveal | Local to the mounted spoiler; not a privacy boundary |
| Menu defaults | Initial local selection; later default changes do not replace user state |
| Controlled select values | Application-owned; callbacks propose a change |
| Channel draft | Local built-in composer state; resets when channel ID changes |
| Standalone composer value | Application-owned through `value` and `onValueChange` |
| Thread navigation | Local in ChannelView unless `activeThreadId` is supplied |
| Reaction count/selected flag | Supplied model; host updates after toggle intent |
| Message list/history data | Supplied snapshot; no automatic fetching or persistence |

Omit `values` for local select state. Supply `[]` for an explicitly empty controlled
selection. At message level, `selectValues` keys are select IDs. At conversation
level, `selectValuesByMessage` keys are first message IDs and then select IDs.
Absent keys or `undefined` permit local state; populated keys let the application
accept/reject proposed values. Remounting a menu by a new ID/kind resets its local
state; changing its available options also prunes unavailable local values.

Changing `channel.id` or standalone `thread.id` remounts the local conversation
content, including drafts and local selections. Application-owned controlled
values survive until the application changes them. In ChannelView, a custom composer
can restore an external draft; standalone ThreadPanel does not expose a composer
replacement prop, so use your own layout if that level of composition is needed.

`activeThreadId={undefined}` permits local channel navigation; a string controls
the selected loaded thread; `null` explicitly closes the controlled panel. Handle
open/close callbacks to update your authoritative state. Missing data is not fetched.

The preserved [Interaction state](./public-api.md) page details callback arguments,
selection keys and navigation. [SSR and hydration](./guides/ssr.mdx) covers stable
initial data and [the guide directory](./guides.md) covers each rendered feature.
