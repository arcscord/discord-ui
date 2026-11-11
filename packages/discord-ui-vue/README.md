# @arcscord/discord-ui-vue

Native Vue components for Discord message interfaces, powered by
`@arcscord/discord-ui-core`. This checkout prepares **0.1.0**; no publication is
implied. Vue 3.5+ in the Vue 3 line is required. React is not a dependency.

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
must update their resolved core to receive corrections. Publish and approve the
required core before staging an adapter release.

## Development validation

From the repository root: `pnpm build:lib`, `pnpm check`, `pnpm docs:check`,
`pnpm test:website`. The package check installs both minimum Vue 3.5.0 and the
locked development version in isolated consumers without React, checks SFC types,
builds server/client code and hydrates it in Chromium. It requires npm registry
access and an installed Chromium browser.

MIT. Adapted markup/rendering retains the upstream notices in
[THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES).
