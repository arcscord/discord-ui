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

MIT © 2026 Arcoz0308.
