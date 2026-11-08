# @arcscord/discord-ui

Composable React components and serializable TypeScript models for Discord message interfaces.

[Documentation](https://ui.arcscord.dev/docs/introduction) ·
[Components](https://ui.arcscord.dev/components) ·
[Playground](https://ui.arcscord.dev/playground)

## Installation

Install the stable `0.1.0` release from npm:

```sh
pnpm add @arcscord/discord-ui@0.1.0
```

See the [installation guide](https://ui.arcscord.dev/docs/installation) for
workspace and local package usage.

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
and emoji, while allowing root-relative local assets. Unicode emoji default to
native text; no CDN is implicit. To use self-hosted Twemoji SVG files:

```tsx
<DiscordUI
  unicodeEmoji={{ mode: "twemoji", baseUrl: "/emojis/twemoji-16.0.1" }}
  allowRemoteMedia={false}
>
  {children}
</DiscordUI>;
```

Serve files directly under `baseUrl` (for example `2764.svg` for ❤️). The parser
uses lowercase, hyphenated Twemoji code points. Missing, blocked or failed images
fall back to Unicode. This applies to text, Markdown, reactions, buttons and
selects; code remains literal. Use `{ mode: "native" }` for device emoji.
An explicit HTTP(S) `baseUrl` also requires remote media to be allowed. Hosts own
the asset version, coverage and Twemoji graphics attribution (CC-BY 4.0).

This replaces the previous implicit jsDelivr rendering: consumers wanting images
must now configure a source. Custom emoji still use `entities.emojis` or resolved
`{ name, image }` metadata, including local GIFs and `:name:` fallbacks.

Emoji-only button models accept `ariaLabel`, falling back to the emoji name.
For primitive `Button`/`LinkButton` React slots, supply a meaningful `ariaLabel`;
without a text label, the emoji slot remains exposed to assistive technology.

Syntax highlighting is opt-in through
`renderHighlightedCode` from `@arcscord/discord-ui/highlight`.

## Guides and reference

- [Quick start](https://ui.arcscord.dev/docs/quick-start) · [API reference](https://ui.arcscord.dev/docs/api-reference).
- [Channels](https://ui.arcscord.dev/docs/guides/channels) · [Threads](https://ui.arcscord.dev/docs/guides/threads).
- [Buttons and selects](https://ui.arcscord.dev/docs/guides/interactions) · [Interaction state](https://ui.arcscord.dev/docs/public-api).
- [Recipes](https://ui.arcscord.dev/docs/recipes) · [Compatibility and limitations](https://ui.arcscord.dev/docs/project/compatibility).
- [Source and contributions](https://github.com/arcscord/discord-ui).

## AI coding agents

The package includes [agent instructions](./AGENTS.md), an offline
[integration guide](./docs/agent-guide.md) and TypeScript declarations in `dist/`.
They travel with the installed version, including when installing a local tarball.
No additional download or installation script is needed.

Dependency instructions are not automatically discovered by every agent. Add this
block to your application's `AGENTS.md` (or equivalent agent instructions):

```md
<!-- BEGIN:arcscord-discord-ui -->
Before working with @arcscord/discord-ui, read
node_modules/@arcscord/discord-ui/AGENTS.md and follow its links to the local
integration guide and declarations for the installed version.
<!-- END:arcscord-discord-ui -->
```

In a monorepo, resolve this path relative to the workspace application that declares
the dependency. With package managers that do not expose `node_modules`, locate
the installed package using that application's package resolution tools.
Installation does not create or overwrite project instruction files. These files
are read as package documentation, not imported as JavaScript entry points.

## License

[MIT](https://github.com/arcscord/discord-ui/blob/main/packages/discord-ui/LICENSE) © 2026 Arcoz0308.
[Third-party notices](https://github.com/arcscord/discord-ui/blob/main/packages/discord-ui/THIRD_PARTY_NOTICES)
cover adapted renderer code, styles and dependency licenses; both files ship with the package.
