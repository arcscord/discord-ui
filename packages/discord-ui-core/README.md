# @arcscord/discord-ui-core

Framework-independent Discord display models, content processing, themes and styles.
This checkout prepares the first core version, **0.2.0**. Registry availability is
separate from local build and tarball validation.

The core does not render components or depend on React, Vue, Angular or Svelte.
Use `@arcscord/discord-ui` for the existing React renderer. Other framework
adapters are future work and have not been validated.

## Public entries

| Entry | Purpose |
| --- | --- |
| `@arcscord/discord-ui-core` | Display models, callback contracts, `BaseDisplayOptions`, `defaultDisplayOptions`, themes, URL/date/select helpers |
| `@arcscord/discord-ui-core/themes` | Presets, `defineTheme`, `resolveTheme`, `themeStyle`, token mapping and types |
| `@arcscord/discord-ui-core/markdown` | `parseMarkdown` and serializable block/node types |
| `@arcscord/discord-ui-core/emoji` | `segmentUnicodeEmoji` and text/emoji segment types |
| `@arcscord/discord-ui-core/highlight` | Optional `highlightCode` and token types |
| `@arcscord/discord-ui-core/styles.css` | Complete, scoped stylesheet with Light/Ash/Dark presets |

Content parsers and highlighting are isolated from ordinary imports. The core is
ESM, targets ES2022 and supports strict TypeScript without framework types.

```ts
import type { MessageView } from "@arcscord/discord-ui-core";
import { parseMarkdown } from "@arcscord/discord-ui-core/markdown";
import { defineTheme, themeStyle } from "@arcscord/discord-ui-core/themes";

const message: MessageView = {
  id: "welcome",
  author: { id: "author", displayName: "Example" },
  timestamp: "2026-11-01T12:00:00Z",
  body: { kind: "markdown", content: "**Hello**" },
};
const blocks = parseMarkdown(message.body.content);
const brand = defineTheme({
  name: "brand",
  extends: "ash",
  tokens: { accent: "#5865f2" }
});
const cssVariables = themeStyle(brand.tokens);
void blocks;
void cssVariables;
```

## Renderer boundary

`parseMarkdown` returns text/list blocks containing nested nodes, entity IDs,
code content and explicit timestamp data. It applies the existing structural
newline and simple-list rules. Renderers interpret node types, resolve entities
and escape text; parsing is not HTML sanitization. `line` identifies the source
boundary used to keep rendered block/list identities stable. Unsupported node
types can be rendered through their `content` fallback.

`segmentUnicodeEmoji` returns text and emoji segments with source offsets. An
emoji's `source` is absent when its URL is blocked. Render its text in that case.
Native mode preserves the original text. No CDN is implicit; Twemoji mode requires
an explicit `baseUrl`. Renderers own image loading and failure fallback.

`highlightCode` returns nested text/span tokens and the normalized recognized
language. Unknown languages return the original text with no language. The
optional entry includes JavaScript, TypeScript, JSON, CSS, Bash and Python plus
their existing aliases. Render text safely; no HTML string is returned.

`BaseDisplayOptions` contains data configuration only. Render callbacks, provider
contexts, reactive state, DOM events, focus and lifecycle belong to each adapter.
Treat exported defaults as shared defaults, not per-request mutable state; copy
configuration and nested values before modifying them.

Models are display contracts, not Discord send-payload validators. IDs remain
strings, classic messages and Components V2 are distinct, and applications own
network calls, persistence, resolved entities and interaction state. Supply
explicit timestamps, reference time, locale and time zone for deterministic SSR.
Use the shared URL helpers and preserve `allowRemoteMedia: false` in renderers.

## Versions

The core and each adapter have independent versions. Adapter dependencies declare
a compatible core range. `^0.2.0` accepts `0.2.x` fixes, not `0.3.0`; after `1.0`,
caret ranges accept compatible minor releases as well. A project with a lockfile
must update its resolved core dependency to receive a newer fix.

A core patch does not require publishing unchanged adapters. An adapter requiring
a new core feature raises its minimum dependency in its own release. Publish and
approve that core version before staging the adapter. See the repository's
`docs/maintainers/releases.md` for the package-specific release process.

## Attribution

MIT. Adapted parsing, highlighting and styles retain upstream notices in
[THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES). Twemoji graphics are not bundled or
loaded implicitly; hosts supplying graphics retain their attribution obligations.
