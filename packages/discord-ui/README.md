# @arcscord/discord-ui

Foundation for an independent React library displaying Discord messages.
Version `0.0.0` is not published. The renderer and playground are planned.

Currently available:

- `MessageView`, `MessageAuthor` and `TextMessageBody` TypeScript types.
- `@arcscord/discord-ui/styles.css`, scoped light/dark theme tokens.
- Compiled ESM and declarations, with React 19 declared as an external peer.

```ts
import type { MessageView } from "@arcscord/discord-ui";

const message: MessageView = {
  id: "example",
  author: { id: "author", displayName: "Example" },
  timestamp: "2026-10-29T18:00:00Z",
  body: { kind: "text", content: "Hello" },
};
```

The timestamp is supplied by the caller. The types describe display data, not a
Discord payload validator. No Discord API calls or runtime framework dependencies
are included. CSS contains tokens only; there is no component to render yet.

MIT © 2026 Arcoz0308.
