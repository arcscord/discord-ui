# @arcscord/discord-ui-svelte

Native Svelte 5 components for Discord-style messages, Components V2, channels
and threads. The adapter uses the same display models and styles as the other
Discord UI adapters. It requires Svelte 5.46.4 or later in the Svelte 5 line.

## Install a local build

From the repository root, build and pack the two packages:

```sh
pnpm build:lib
pnpm --filter @arcscord/discord-ui-core pack --pack-destination /tmp/discord-ui
pnpm --filter @arcscord/discord-ui-svelte pack --pack-destination /tmp/discord-ui
```

In your Svelte project's `pnpm-workspace.yaml`, point the core resolution at
the matching archive:

```yaml
overrides:
  "@arcscord/discord-ui-core": "file:/tmp/discord-ui/arcscord-discord-ui-core-0.2.0.tgz"
```

Then run `pnpm add /tmp/discord-ui/arcscord-discord-ui-svelte-0.1.0.tgz`.

## Render a message

```svelte
<script lang="ts">
  import type { MessageView } from "@arcscord/discord-ui-svelte";
  import { DiscordUI, Message } from "@arcscord/discord-ui-svelte";
  import "@arcscord/discord-ui-svelte/styles.css";

  const message: MessageView = {
    id: "hello",
    author: { id: "guide", displayName: "Field Guide" },
    timestamp: "2026-11-01T10:24:00Z",
    body: { kind: "markdown", content: "**Hello!** ||Hidden note||" },
  };
</script>

<DiscordUI theme="ash" locale="en-US" timeZone="UTC" referenceTime="2026-11-01T10:24:00Z">
  <Message {message} />
</DiscordUI>
```

Import component props and shared models from the root. Use snippets for
custom content and `on…` callbacks to update application-owned data. Install
Core directly to use `@arcscord/discord-ui-core/discord-api` for converting
received Discord API data.

`./themes` exposes presets, token types and `defineTheme`. To opt into code
highlighting, import `HighlightedCode` from `./highlight` and render it in
`DiscordUI`'s `renderCode(content, language)` snippet.

For SSR, keep initial model data, time zone, locale, theme, media rules and
reference time consistent across server and client. See the [Svelte examples](https://ui.arcscord.dev/docs/svelte),
[API reference](https://ui.arcscord.dev/docs/svelte/api) and
[SSR guide](https://ui.arcscord.dev/docs/svelte/ssr).
