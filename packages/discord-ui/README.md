# @arcscord/discord-ui

Composable React components and serializable TypeScript models for Discord message interfaces.

[Documentation](https://ui.arcscord.dev/docs/introduction) ·
[Components](https://ui.arcscord.dev/components) ·
[Playground](https://ui.arcscord.dev/playground)

## Installation

In development (`0.0.0`), preparing the first npm release. Follow the
[workspace installation guide](https://ui.arcscord.dev/docs/installation).

Requires **React `^19.0.0`**, supplied by your application. The package ships ESM
and precompiled, scoped CSS. No Tailwind setup, global reset or remote font is required.

## First message

Import the stylesheet once at your application's CSS entry point and wrap
message components in `DiscordUI`:

```tsx
import type { MessageView } from "@arcscord/discord-ui";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

const message: MessageView = {
  id: "hello",
  author: { id: "bot", displayName: "Example Bot", bot: true },
  timestamp: "2026-11-01T10:24:00Z",
  body: { kind: "markdown", content: "Hello from **React**!" },
};

export default function App(): React.ReactElement {
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      <Message message={message} />
    </DiscordUI>
  );
}
```

## What you can render

- Text and Discord Markdown, mentions, emoji, spoilers, embeds, images and files.
- Classic messages and Components V2, including buttons and all five select menu kinds.
- Channels and threads, reactions, replies, edited markers and ephemeral notices.
- A composer with message submission and slash-command input callbacks.

Use `Message` and `ChannelView` for complete views, or compose primitives such as
`MessageFrame`, `Avatar` and `MessageContent`. Your application supplies resolved
display data and handles interaction callbacks, persistence and network requests.
The library does not connect to Discord or validate Discord send payloads.

## Themes

Choose `theme="light"`, `theme="ash"` or `theme="dark"` (the default).
Override individual values with `DiscordUI.tokens`, or create a reusable theme
with `defineTheme` from `@arcscord/discord-ui/themes`.

See the [theme guide](https://ui.arcscord.dev/docs/guides/themes) for custom themes
and the [token reference](https://ui.arcscord.dev/docs/api/themes) for available overrides.

## Display options

`DiscordUI` also accepts `locale`, `timeZone`, `referenceTime`, `entities` and
customizable `labels`. Defaults use `en-US` and `UTC`; timestamps come from your
data, with no implicit clock. Keep display options and initial data equal during
server rendering and hydration.

Use `allowRemoteMedia={false}` to block remote image resources, including avatars
and emoji. Syntax highlighting is opt-in through
`renderHighlightedCode` from `@arcscord/discord-ui/highlight`.

## Guides and reference

- [Quick start](https://ui.arcscord.dev/docs/quick-start) · [API reference](https://ui.arcscord.dev/docs/api-reference).
- [Channels](https://ui.arcscord.dev/docs/guides/channels) · [Threads](https://ui.arcscord.dev/docs/guides/threads).
- [Buttons and selects](https://ui.arcscord.dev/docs/guides/interactions) · [Interaction state](https://ui.arcscord.dev/docs/public-api).
- [Recipes](https://ui.arcscord.dev/docs/recipes) · [Compatibility and limitations](https://ui.arcscord.dev/docs/project/compatibility).
- [Source and contributions](https://github.com/arcscord/discord-ui).

## License

[MIT](https://github.com/arcscord/discord-ui/blob/main/packages/discord-ui/LICENSE) © 2026 Arcoz0308.
[Third-party notices](https://github.com/arcscord/discord-ui/blob/main/packages/discord-ui/THIRD_PARTY_NOTICES)
cover adapted renderer code, styles and dependency licenses; both files ship with the package.
