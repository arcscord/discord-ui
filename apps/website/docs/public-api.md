---
title: Interaction state
---

# Interaction state

The application supplies resolved display data and handles persistence and Discord
requests. Rendering a message does not send it to Discord. Read
[core concepts](./concepts.md) for model boundaries and
[buttons and select menus](./guides/interactions.mdx) for the five menu variants.

## Controlled selections

`SelectMenu` accepts `values` and `onChange`. `Message` and `MessageComponents`
accept `selectValues`, keyed by select ID. `MessageList`, `ChannelView` and
`ThreadPanel` accept `selectValuesByMessage`, keyed first by message ID and then
select ID. An empty array explicitly clears a selection; a missing key enables
local state initialized from the menu defaults.

```tsx
import type { MessageView, SelectValues } from "@arcscord/discord-ui";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React, { useState } from "react";
import "@arcscord/discord-ui/styles.css";

export function InteractiveMessage({ message }: { message: MessageView }) {
  const [selectValues, setSelectValues] = useState<SelectValues>({ choice: [] });
  return (
    <DiscordUI>
      <Message
        message={message}
        selectValues={selectValues}
        onSelectChange={(id, values) => {
          setSelectValues(current => ({ ...current, [id]: values }));
        }}
      />
    </DiscordUI>
  );
}
```

The supplied message must contain a select whose ID is `choice`. To reject an
interaction, keep the controlled values unchanged. Updating `default` or
`defaultValues` on the same menu does not replace user state; use controlled
values for that. Changing the menu's ID or kind creates fresh local state.

Options and entities form a complete resolved snapshot, including selected
entities. Values absent from that snapshot are removed from local state and
excluded from callbacks. When loading or searching server data externally, merge
selected entities into the snapshot. Duplicate selections are removed and values
are limited by `maxValues`.

## Interaction context

Existing callback arguments are preserved. The final argument is a
`ComponentInteractionContext`:

- `onButtonClick(id, context)`
- `onSelectChange(id, values, context)`
- `onPremiumClick(skuId, context)`

`context.componentId` identifies the clicked component or select.
`context.messageId` is supplied by `Message` and all conversation components.
For standalone `MessageComponents`, pass `messageId` when that context is needed.
Component IDs must be unique within a message; different messages may reuse them.
Handlers accepting only the original arguments continue to work.

## Conversation identity and thread navigation

Changing `channel.id` on `ChannelView`, or `thread.id` on a standalone
`ThreadPanel`, resets its draft and local interaction state. The application can
provide a custom composer on `ChannelView` when drafts need to persist across
conversations. Standalone `ThreadPanel` has no composer replacement prop.
Application-owned controlled values are not cleared by these local remounts.

`ChannelView` navigates threads locally by default. Pass `activeThreadId` to
control navigation externally: a string opens a loaded thread, and `null` closes
the panel. `onThreadOpen(id)` and `onThreadClose()` report navigation intent;
the application updates the controlled value. Unknown or unavailable IDs do not
open a panel. These callbacks do not fetch thread contents.

## Labels and media

Use `DiscordUI.labels` to override `selectPlaceholder`,
`channelSelectPlaceholder`, `removeSelection` (`{name}`), `selectNoResults`,
`selectNoOptions`, `userOnline`, `userIdle`, `userDnd` and `userOffline`.
Date and number formatting use `locale` separately.

`allowRemoteMedia={false}` also blocks avatars in selected chips and select
options. Invalid, blocked or failed select avatars fall back to the user's initial.

## Public types

Every public component exports its corresponding `*Props` type. Serializable
model arrays accept `readonly` inputs, including `as const` fixtures. Applications
should create updated snapshots instead of mutating model arrays in place.

## Related guides

[Channels](./guides/channels.mdx), [threads](./guides/threads.mdx),
[reactions](./guides/reactions.mdx), [localization](./guides/localization.mdx) and
[media policy](./guides/media.mdx#remote-media-policy) explain the corresponding
application responsibilities and working examples.
