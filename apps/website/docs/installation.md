---
title: Installation
hide_table_of_contents: true
pagination_next: null
pagination_prev: null
---

# Installation status

`@arcscord/discord-ui` is currently version `0.0.0` and has not been published to npm.
The library currently declares React 19 as its peer dependency.

Within this monorepo, add `"@arcscord/discord-ui": "workspace:*"` to your app's dependencies,
then build the library with `pnpm build:lib`.

```tsx
import { DiscordUI, Message } from "@arcscord/discord-ui";
import "@arcscord/discord-ui/styles.css";

export function Example() {
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      <Message message={{
        id: "hello",
        author: { id: "bot", displayName: "Welcome Bot", bot: true },
        timestamp: "2026-11-01T10:24:00Z",
        body: { kind: "markdown", content: "**Hello from React!**" },
      }}
      />
    </DiscordUI>
  );
}
```

The stylesheet is precompiled and scoped. No Tailwind configuration is required.
Public installation commands will be added when the first npm release is available.
