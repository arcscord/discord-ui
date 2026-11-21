# @arcscord/discord-ui-vue

Native Vue components for Discord message interfaces, powered by
`@arcscord/discord-ui-core`. Vue 3.5+ in the Vue 3 line is required.

## Installation

For a registry install, choose a [version on npm](https://www.npmjs.com/package/@arcscord/discord-ui-vue?activeTab=versions)
or use the default `latest` tag.

```sh
pnpm add @arcscord/discord-ui-vue
```

## Usage

```vue
<script setup lang="ts">
import type { MessageView } from "@arcscord/discord-ui-vue";
import { DiscordUI, Message } from "@arcscord/discord-ui-vue";
import "@arcscord/discord-ui-vue/styles.css";

const message: MessageView = {
  id: "hello",
  author: { id: "author", displayName: "Example" },
  timestamp: "2026-11-01T12:00:00Z",
  body: { kind: "markdown", content: "**Hello from Vue!**" },
};
</script>

<template>
  <DiscordUI theme="dark" locale="en-US" time-zone="UTC" reference-time="2026-11-01T12:00:00Z">
    <Message :message="message" />
  </DiscordUI>
</template>
```

Import components and types from the main entry. The complete stylesheet needs
no Tailwind, reset or remote fonts. Light/Ash/Dark and inherited custom themes
use the core's tokens. `./themes` contains theme helpers; `./highlight` contains
optional `renderHighlightedCode`, returning Vue nodes for `DiscordUI.renderCode`.
Grammars are isolated from ordinary component imports. CSS is identical to the core.

All public React component names have Vue equivalents. Models are re-exported
from the core and retain their constraints. Composition uses default/named slots;
`Button` uses `variant` for appearance, reserving Vue `class` and `style` attributes.
Every component exports `…Props`, `…Slots` and `…Emits` types where applicable.
See [the integration guide](./docs/agent-guide.md) and
[the parity matrix](./docs/parity.md) for the complete surface.

Use `:allow-remote-media="false"` with
`:remote-media-allowlist="['https://cdn.discordapp.com/emojis/']"` on `DiscordUI`
to allow image URLs from the Discord emoji directory supplied in your display
data. The shared policy accepts absolute HTTP(S) origins, directories ending in
`/`, and exact paths.

`ChannelComposer` uses `v-model`; `SelectMenu` uses `v-model:values`.
`ChannelView` supports `v-model:active-thread-id`. Missing selections use local
state, `[]` is controlled empty state, and `null` explicitly closes a controlled
thread. Props are never mutated. Subscribe to `button-click`, `select-change`,
`reaction-toggle`, `send`, `slash-command`, `thread-send` and related typed events
to update application-owned state. No Discord API call or persistence is implicit.

SSR uses `createSSRApp` plus `@vue/server-renderer` at the same Vue version. Keep
initial models, timestamps, reference time, locale, time zone, themes and root
`idPrefix` equal on server and client. Each request needs fresh app/state.
DOM work starts after mount and cleans up on unmount. Nuxt and other browsers
are not implied by the Vue SSR and Chromium acceptance checks.

The package has an independent version and `vue-vX.Y.Z` release tags. Its compatible
core range is expanded from `workspace:^` when packed; projects with lockfiles
must update their resolved core to receive compatible JavaScript fixes. For
fixes to the bundled stylesheet, install a Vue release built with the updated
core. Publish and approve the required core before staging an adapter release.

## Development validation

From the repository root: `pnpm build:lib`, `pnpm check`, `pnpm docs:check`,
`pnpm test:website`. The package check installs both minimum Vue 3.5.0 and the
locked development version in isolated consumers without React, checks SFC and
NodeNext types,
builds server/client code and hydrates it in Chromium. It requires npm registry
access and an installed Chromium browser.

MIT. Adapted markup/rendering retains the upstream notices in
[THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES).

## Video, audio and stickers

`Video`, `Audio` and `Sticker` render serializable `VideoView`, `AudioView` and
`StickerView` models. `Message.media` and V2 galleries accept images and videos;
classic-message `attachments` accept file cards and audio, and `stickers` accepts
sticker models. Set `voice: true` for a vocal, with optional normalized `waveform`
samples and `durationSeconds`. PNG, APNG and GIF stickers render in the browser;
Lottie has an explicit unsupported-format state.

Players start on user interaction with custom keyboard-accessible controls.
Audio and videos with supplied posters use `preload="none"`; videos without posters
load metadata to show a first-frame preview. Video controls overlay the preview
after playback starts. Audio files and videos expose a top-right download link on
hover or keyboard focus; voice notes omit that action. Hover or focus the speaker for a vertical volume slider;
Escape closes it and returns speaker focus. Website sticker examples use the
supplied Arcscord logo as a local sticker asset. The browser determines codec support. Sources and video
posters follow `allowRemoteMedia` and `remoteMediaAllowlist`; spoilers defer
player mounting until reveal.

## Mentioned messages

Set `MessageView.mentioned` to `true` for the current viewer's highlighted
messages. Rendering adapters also expose `MessageFrame.mentioned` for composed
layouts. The host supplies the flag; Markdown mention tokens and API conversion
leave it unset. The highlight uses its hover background on hover and keyboard focus. Ephemeral appearance takes precedence
when both flags are true. Theme overrides accept `mentionedBackground`, `mentionedHover` and
`mentionedBorder`.

### Author, mention and message intent

Pass `onUserClick`, `onUserContextMenu`, `onMentionClick`,
`onMentionContextMenu` and `onMessageContextMenu` to `Message`, `MessageList`,
`ChannelView` or `ThreadPanel`. Callbacks receive the author, `MentionTarget` or
message, followed by the pointer event. Mention targets include a string `id`,
`kind` (`user`, `role`, `channel`, `command`), `name` and optional `color`.
Reply authors and mentions in rich content use the same callbacks.

Events use native DOM `MouseEvent`. Vue template listeners use `@user-click`, `@user-context-menu`, `@mention-click`, `@mention-context-menu` and `@message-context-menu`.
User and mention context handlers stop propagation to the message handler.
The host can call `event.preventDefault()` to replace the browser menu, and owns
profile information, menu actions, dismissal and focus restoration.
