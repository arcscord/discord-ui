# @arcscord/discord-ui

Composable React 19 primitives for Discord messages. Version `0.0.0`, unpublished.

```tsx
import { DiscordUI, Message } from "@arcscord/discord-ui";
import "@arcscord/discord-ui/styles.css";

<DiscordUI theme="dark" locale="en-US" timeZone="UTC">
  <Message message={{
    id: "example",
    author: { id: "author", displayName: "Example", bot: true },
    timestamp: "2026-10-29T18:00:00Z",
    body: { kind: "text", content: "Hello" },
  }}
  />
</DiscordUI>;
```

Compose `MessageFrame` using explicit `avatar`, `header`, `footer` and `children`
props. Public primitives: `Avatar`, `Author`, `MessageHeader`, `MessageTimestamp`,
`MessageContent`. They share the same implementation as `Message`.

`DiscordUI` controls theme, locale and timezone. Defaults are dark, en-US and UTC.
Dates require an explicit timezone and are deterministic during SSR. Avatars use a
fallback on invalid URLs or load failure. There are no Discord API calls.

The React entry is a client boundary compatible with server prerendering; import
models with `import type`. CSS is precompiled, with no Tailwind setup or global reset.


## Themes

The presets are `light`, `ash` and `dark`. Preset colors have a single source in
`src/styles/themes.css`; `src/themes.ts` defines the typed token mapping and preset
registry. Layout and components do not branch on individual theme names.

```tsx
<DiscordUI theme="ash" tokens={{ codeBackground: "#303348" }}>
  <Message message={message} />
</DiscordUI>;
```

Create a reusable theme by extending a preset or another custom theme:

```tsx
import { defineTheme } from "@arcscord/discord-ui/themes";

const brand = defineTheme({
  name: "brand",
  extends: "ash",
  tokens: {
    background: "#242630",
    focusBackground: "#303340",
    codeBackground: "#1c1e28",
    spoilerBackground: "#747784",
    quoteBorder: "#606577",
    accent: "#8da4ff",
  },
});

<DiscordUI theme={brand}>{/* messages */}</DiscordUI>;
```

`tokens` on a scope override the theme object's tokens. Extending a custom theme
inherits its overrides without mutating the parent. A custom name retains its base
palette and light/dark color scheme. The `/themes` entry contains pure helpers and
can be imported in server configuration without a React client boundary.

For CSS customization, give `DiscordUI` a `className` and override variables such as
`--discord-ui-background`, `--discord-ui-code-background`, `--discord-ui-spoiler-hidden`
and `--discord-ui-quote-border` on that class. `ThemeTokens` and
`themeTokenProperties` expose the full typed list, including surfaces, text, buttons
and highlighting. Each scope owns its palette; an inner scope can use another theme.

| Token | Light | Ash | Dark |
| --- | --- | --- | --- |
| `background` | `#FBFBFB` | `#323339` | `#1A1A1E` |
| `focusBackground` | `#EEEEEF` | `#3E3F46` | `#29292E` |
| `codeBackground` | `#E8E8EF` | `#343748` | `#1F202F` |
| `spoilerBackground` | `#8E9097` | `#7D7E86` | `#666770` |
| `quoteBorder` | `#C5C6CA` | `#595A63` | `#474850` |

Code backgrounds apply to inline and fenced code. The focus surface applies on
message hover and keyboard focus within the message.

## Rich content

Use `body: { kind: "markdown", content: "**Hello**" }` for Discord Markdown.
`text` remains literal. Optional `message.media` and `message.embeds` render images
and embeds. Items and embed fields have stable string IDs. Public primitives also
include `Markdown`, `Mention`, `Emoji`, `Spoiler`, `Media`, `MediaGallery` and `Embed`.

`DiscordUI` accepts `entities`, `referenceTime`, `allowRemoteMedia`, `labels` and
`renderCode`. Entity names and custom emoji URLs come from the caller. Media accepts
HTTP(S), safe root-relative paths, HTTP(S)-origin blob URLs and base64 raster images.
Setting `allowRemoteMedia={false}` blocks HTTP(S) image resources, including avatars
and emoji. Links remain separately limited to HTTP(S). No HTML is injected.

Spoilers support keyboard reveal/hide and leave hidden media unmounted. Failed
images and emojis have fallbacks. Gallery images preserve natural proportions.
Relative timestamps use the message timestamp unless an explicit reference clock
is supplied. Standalone `Markdown` uses a fixed epoch when no clock is supplied.
UI labels can be overridden separately from date locale.

Syntax highlighting is optional:

```tsx
import { renderHighlightedCode } from "@arcscord/discord-ui/highlight";

<DiscordUI renderCode={renderHighlightedCode}>{/* messages */}</DiscordUI>;
```

The optional entry includes JavaScript, TypeScript, JSON, CSS, Bash and Python.
Unknown languages remain escaped plain text. The main renderer does not load these
grammars. Consumers that omit this entry can omit highlighting entirely.

Components V2 use `body: { kind: "components-v2", components: [...] }` with a typed,
serializable view model. Supported primitives: `Container`, `Section`, `TextDisplay`,
`Thumbnail`, `MediaGallery`, `Separator`, `ActionRow` and `LinkButton`.
`MessageComponents` renders this model independently. A V2 body cannot include
classic embeds or message-level media. This is a display model, not a Discord API
payload adapter or validator. Disabled/unsafe link buttons never render an href.

Styles are adapted from the AutoThreads renderer, preserving the original cascade
and its local corrections. They are mapped to this package's classes and tokens and
inlined into the distributed stylesheet; no source CSS imports remain. Text spoilers
keep their natural dimensions under a mask. Hidden media remains unmounted.

Current scope: messages, basic Markdown lists, image media, embeds and the V2 subset
above. Nested lists, exact Discord gallery parity, video/audio, payload adapters,
custom-id button interactions, reactions and threads are not implemented. Next.js/Docusaurus integration builds remain pending.

Markdown/highlighting logic is adapted from AutoThreads; see `THIRD_PARTY_NOTICES`
for the upstream BF-GO MIT notice and dependency licenses. Styles and the external-link icon also adapt the renderer. Example assets are new.

MIT © 2026 Arcoz0308.
