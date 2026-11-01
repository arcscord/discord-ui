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
| `surface` (embeds/containers) | `#FFFFFF` | `#393A41` | `#242429` |
| `focusBackground` | `#EEEEEF` | `#3E3F46` | `#29292E` |
| `codeBackground` | `#E8E8EF` | `#343748` | `#1F202F` |
| `spoilerBackground` | `#8E9097` | `#7D7E86` | `#666770` |
| `quoteBorder` | `#C5C6CA` | `#595A63` | `#474850` |

`containerSurface` inherits `surface` by default, so changing the shared surface
updates both embeds and V2 containers. Override `containerSurface` only to give
containers a distinct background.

Link-button surfaces use separate customizable tokens:

| Token | Light | Ash | Dark |
| --- | --- | --- | --- |
| `linkButtonBackground` | `#EEEEEF` | `#3E3F46` | `#29292E` |
| `linkButtonDisabledBackground` | `#F4F4F5` | `#383940` | `#2F2F34` |

`linkButtonText` and `linkButtonDisabledText` control foreground colors. Disabled
buttons retain an opaque background and never navigate.

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
custom-id button interactions are not implemented. Next.js/Docusaurus integration builds remain pending.

Markdown/highlighting logic is adapted from AutoThreads; see `THIRD_PARTY_NOTICES`
for the upstream BF-GO MIT notice and dependency licenses. Styles and the external-link icon also adapt the renderer. Example assets are new.

MIT © 2026 Arcoz0308.


## Channel view

`ChannelView` composes `ChannelHeader`, `MessageList` and `ChannelComposer`. Its
serializable `ChannelViewModel` contains `id`, `name`, optional `topic` and an
ordered `messages` array using the existing `MessageView` contract.

```tsx
<DiscordUI theme="ash" locale="fr-FR" timeZone="Europe/Zurich">
  <ChannelView channel={{ id: "example", name: "exemple", messages }} />
</DiscordUI>;
```

The header and composer remain outside the scrollable history. Default height is
560px; use `height` to adjust it. The channel opens at the bottom by default and
follows the latest message, including subsequent media layout changes. Scrolling
up stops following media resizes. Set `autoScroll={false}` to manage scrolling
externally. Date separators respect the supplied locale and timezone and can be
hidden with `showDateSeparators={false}`.

Pass `onSend(content)` to receive composer submissions; the consumer owns and
updates `channel.messages`. Enter submits, Shift+Enter inserts a newline, and IME
composition does not submit. Without `onSend`, the prepared text area remains
editable and no send action is shown. The library does not publish messages.

Use `header` and `composer` slots to replace these regions, or `composer={false}`
to hide input. `ChannelHeader.actions` and `ChannelComposer.leading`/`trailing`
accept real application controls. `ChannelComposer` is controlled through `value`
and `onValueChange`; `ChannelView` manages its default composer's draft locally.

`channelHeaderDivider` and `channelInputBackground` theme tokens customize the
header border and composer surface. The header border is 1 CSS pixel, corresponding
to 2 physical pixels at Retina scale 2. The composer uses the header border color
at rest and the container outline color on focus, without an additional outline.

| Token | Light | Ash | Dark |
| --- | --- | --- | --- |
| `channelHeaderDivider` | `#DFDFE1` | `#3E3F45` | `#29292E` |
| `channelInputBackground` | `#FFFFFF` | `#383A41` | `#222327` |

The playground's channel scenario includes multiple authors, an image and local
simulated sending. Its JSON editor accepts the whole channel model, including
message arrays, while preserving the last valid preview on errors.


## Threads

A message can carry an optional `thread: ThreadSummaryView` with `id`, `name`,
`messageCount` and an optional `lastMessage` containing author, plain-text content
and timestamp. `ThreadPreview` renders this card directly; `Message` adds it and
its decorative avatar connector automatically. The card uses `containerSurface`
and `containerOutline` and truncates the last-message text on a single line.

Supply `onThreadOpen(id)` to `Message` or `MessageList` to make a summary interactive.
Without a handler the summary is a read-only card. Relative time uses `referenceTime`
from `DiscordUI`; without an explicit clock it defaults to the last-message timestamp
for deterministic rendering.

To open threads within `ChannelView`, add a `threads: ThreadView[]` array to the
channel. Each entry contains `id`, `name`, `parentMessageId` and its reply `messages`.
The parent remains in `channel.messages`, where its summary references the same
thread ID. `messageCount` counts replies, not the starter. A summary without loaded
thread contents remains read-only. `ThreadMessageView` excludes nested thread summaries.

`ChannelView` displays one thread at a time beside the channel. Below 640px of
available width, the panel replaces the main channel until closed. It shows the
starter and replies, opens at the bottom, and reuses the channel header and composer.
The close button and Escape return focus to the opener. Editing JSON does not steal
focus when a thread is removed. The optional `onThreadSend(threadId, content)` callback
reports submissions; the consumer owns reply data, summary counters and last-message
metadata. The playground updates all of these for its local simulation.

`ThreadPanel` can also be composed directly with `thread`, optional `parentMessage`,
`onClose` and `onSend` inside `DiscordUI`. It does not open nested thread panels.
No Discord API calls are made. UI labels and singular/plural count text are overridable
through `DiscordUI.labels`.


## Reactions and emoji

Unicode emoji use `@twemoji/parser` and Twemoji SVG assets (version 17.0.3).
Plain text, Markdown, button emoji and reactions share this rendering. Code stays
literal. With `allowRemoteMedia={false}` or a failed image, Unicode characters remain
visible. Custom emoji continue to use caller-supplied image URLs.

Add `reactions: [{ id: "like", emoji: { name: "👍" }, count: 12, me: true }]` to
any message, including V2 messages and thread replies. Custom emoji use
`emoji: { name: "arc", image: "/arc.png" }`. Zero-count reactions are hidden.

`Message`, `MessageList`, `ChannelView` and `ThreadPanel` accept
`onReactionToggle(messageId, reactionId)`. The caller updates the count and `me`
state; without a handler reactions are read-only. The standalone `Reactions`
primitive accepts `reactions` and `onToggle(reactionId)`. The group label is
customizable with `labels.reactions`.

Fenced and inline code wrap long lines, including highlighted tokens, without
internal scrollbars. Source whitespace and line breaks are preserved.


## Generated avatars

`Avatar` generates a single-letter avatar when no usable image is available.
Its default background is selected deterministically from the author ID. Set
`author.avatarFallback: { background: "#337c96", letter: "A", color: "#ffffff" }`
to customize it. Colors accept six-digit hex values. The first grapheme of the
letter (or display name) is used, including Unicode emoji. Image failures and
blocked remote images use the same fallback. `avatarUrl` takes priority.
The website's Avatar playground example includes live letter and color controls.

## Interactive message components

`Message` and `MessageComponents` accept `onButtonClick(id)`,
`onSelectChange(id, values)` and `onPremiumClick(skuId)` callbacks. These are local
UI events; the host handles its own actions or purchase flow.

Action rows accept either `buttons` (existing link buttons, action buttons or
premium buttons) or a single `select`. Sections also accept action buttons as
accessories. Classic text/Markdown messages can include `components: ActionRowView[]`
alongside their embeds and media. V2 messages keep these rows in `body.components`.

```tsx
const row: ActionRowView = {
  id: "choices",
  kind: "action-row",
  select: {
    id: "test-values",
    kind: "string-select",
    placeholder: "Choose test values",
    minValues: 0,
    maxValues: 2,
    options: [
      { value: "alpha", label: "Alpha", description: "First typed value" },
      { value: "beta", label: "Beta", description: "Second typed value" },
    ],
  },
};
```

Select kinds: `string-select`, `user-select`, `role-select`, `mentionable-select`,
`channel-select`. String menus alone accept `options` with `value`, `label`,
`description`, `emoji` and `default`. Entity menus accept resolved `entities`
and typed `defaultValues: [{ id, type }]`; no Discord resources are fetched.
User entities reuse `UserView` (author identity, avatar and app fields), roles
reuse `RoleView` (`id`, `name`, `color`), and channels reuse `ChannelEntityView`.
Mentionable menus accept users and roles only. Channel menus alone accept
`channelTypes`, using Discord's numeric channel type IDs. Entity rows have no
custom description or emoji. Usernames, presence and app badges belong to users;
role colors belong to roles; channel type, rules and lock icons belong to channels.
Entity menus provide search and removable selection chips. String menus keep
Discord's label/description layout, with an optional emoji spanning both lines. `SelectMenu` can also be used directly with controlled
`values` and `onChange`, or local state initialized from option defaults. Menus
support arrow keys, Home/End, first-letter navigation, Enter/Space, Escape, and
outside-click dismissal. Theme tokens `selectBackground`, `selectMenuBackground`
and `selectMuted` control their opaque surfaces and placeholder text.

`Button` supports primary, secondary, success, danger and premium styles.
`File` renders a file name, optional display size, safe HTTP(S) link and spoiler.
The playground's **Composants interactifs** scenario demonstrates every variant.
