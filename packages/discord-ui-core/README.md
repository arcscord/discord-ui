# @arcscord/discord-ui-core

Framework-independent Discord display models, content processing, themes and styles.

The core does not render components or depend on React, Vue, Angular or Svelte.
Use `@arcscord/discord-ui` for React and `@arcscord/discord-ui-vue` for Vue.

## Installation

Install the core directly to use its framework-independent APIs. The React and
Vue adapters install the core as a dependency.

```sh
pnpm add @arcscord/discord-ui-core
```

Check the [npm versions](https://www.npmjs.com/package/@arcscord/discord-ui-core?activeTab=versions)
to see which release the `latest` tag selects.

## Public entries

| Entry | Purpose |
| --- | --- |
| `@arcscord/discord-ui-core` | Display models, callback contracts, `BaseDisplayOptions`, `defaultDisplayOptions`, themes, URL/date/select helpers |
| `@arcscord/discord-ui-core/themes` | Presets, `defineTheme`, `resolveTheme`, `themeStyle`, token mapping and types |
| `@arcscord/discord-ui-core/markdown` | `parseMarkdown` and serializable block/node types |
| `@arcscord/discord-ui-core/emoji` | `isUnicodeEmoji`, `segmentUnicodeEmoji` and text/emoji segment types |
| `@arcscord/discord-ui-core/discord-api` | Convert received Discord API v10 data into display models |
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

## Convert received Discord data

`fromDiscordMessage` converts complete Discord API v10 message objects into
`MessageView` for React or Vue. Use `fromDiscordMessageComponents` for a component
array on its own and pass `{ attachments }` to resolve `attachment://` URLs.
`fromDiscordUser`, `fromDiscordRole` and `fromDiscordChannel` convert entity
identities. Unnamed channels and unknown channel types return `undefined`.

Both message helpers accept `selectEntities`, keyed by the menu's Discord
`custom_id`. Each entry can provide `users`, `roles` and `channels` as display
models. Entity menus start with an empty list when those choices are absent.
The host authorizes access, supplies mention lookups and handles interactions.
The message helper uses available data and omits unsupported nodes, including
media references it cannot resolve. The renderer supports images and file links.

### With discord.js v14

If you already have a discord.js `Message`, each component's `toJSON()` returns
API-shaped data. It works directly for a component preview. For `attachment://`
references, also supply the raw message's `attachments` array. If you only need
a user preview, use the `User` display properties directly. Both paths use the
objects you already have.

```ts
import type { UserView } from "@arcscord/discord-ui-core";
import type { Message, User } from "discord.js";
import { fromDiscordMessageComponents } from "@arcscord/discord-ui-core/discord-api";
import { UserFlags } from "discord.js";

export function messageComponents(message: Message) {
  return fromDiscordMessageComponents(message.components.map(component => component.toJSON()));
}

export function userView(user: User): UserView {
  return {
    id: user.id,
    username: user.username,
    displayName: user.displayName,
    avatarUrl: user.displayAvatarURL(),
    bot: user.bot,
    verified: user.flags?.has(UserFlags.VerifiedBot) ?? false,
  };
}
```

For full message previews, use raw `MESSAGE_CREATE` packets or REST.
`Message#toJSON()` returns discord.js fields such as `authorId` and
`createdTimestamp`, and `User#toJSON()` uses `globalName` and `flags`.
The raw converters expect Discord API fields such as `author` and `timestamp`.
If you already have a `Message`, pass its `channelId` and `id` to `readMessage`
below to retrieve the raw response. The REST method returns `unknown`, so the
example types responses from those known routes. Reconstruct a full message
before converting a partial update. Only the bot needs discord.js.

```ts
import type { MessageView } from "@arcscord/discord-ui-core";
import type { GatewayDispatchPayload, RESTGetAPIChannelMessageResult, RESTGetAPIUserResult } from "discord-api-types/v10";
import type { Client } from "discord.js";
import { fromDiscordMessage, fromDiscordUser } from "@arcscord/discord-ui-core/discord-api";
import { Events, Routes } from "discord.js";

export function watchMessages(client: Client, onMessage: (message: MessageView) => void) {
  client.on(Events.Raw, (packet: GatewayDispatchPayload) => {
    if (packet.t === "MESSAGE_CREATE")
      onMessage(fromDiscordMessage(packet.d));
  });
}

export async function readMessage(client: Client, channelId: string, messageId: string) {
  const data = await client.rest.get(Routes.channelMessage(channelId, messageId)) as RESTGetAPIChannelMessageResult;
  return fromDiscordMessage(data);
}

export async function readUser(client: Client, userId: string) {
  const data = await client.rest.get(Routes.user(userId)) as RESTGetAPIUserResult;
  return fromDiscordUser(data);
}
```

The payload reflects the bot's permissions and Gateway intents. For example,
Discord can withhold message content, attachments, embeds and components. See
the [Discord message resource](https://docs.discord.com/developers/resources/message).

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
must update its resolved core dependency to receive compatible JavaScript fixes.
Each adapter copies the core stylesheet at build time. When the shared CSS
changes, rebuild and release the adapters so their CSS entry points include the fix.

An adapter requiring a new core feature raises its minimum dependency in its
own release. Publish and approve that core version before staging the adapter.
See the repository's
`docs/maintainers/releases.md` for the package-specific release process.

## Attribution

MIT. Adapted parsing, highlighting and styles retain upstream notices in
[THIRD_PARTY_NOTICES](./THIRD_PARTY_NOTICES). Twemoji graphics are not bundled or
loaded implicitly; hosts supplying graphics retain their attribution obligations.
