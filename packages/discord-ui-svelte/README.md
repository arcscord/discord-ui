# @arcscord/discord-ui-svelte

Native Svelte 5 components for Discord-style messages, Components V2, channels
and threads. The adapter uses the same display models and styles as the other
Discord UI adapters. It requires Svelte 5.46.4 or later in the Svelte 5 line.

Svelte `0.1.0-beta.1` and its upcoming Core `0.3.0-beta.1` dependency are unpublished.
Use local builds to try this adapter.

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
  "@arcscord/discord-ui-core": "file:/tmp/discord-ui/arcscord-discord-ui-core-0.3.0-beta.1.tgz"
```

Then run `pnpm add /tmp/discord-ui/arcscord-discord-ui-svelte-0.1.0-beta.1.tgz`.

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

Events use native DOM `MouseEvent`.
User and mention context handlers stop propagation to the message handler.
The host can call `event.preventDefault()` to replace the browser menu, and owns
profile information, menu actions, dismissal and focus restoration.
