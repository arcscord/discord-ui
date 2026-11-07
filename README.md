# Arcscord Discord UI

Composable React components and TypeScript display models for Discord message interfaces.

[Documentation](https://ui.arcscord.dev/docs/introduction) ·
[Components](https://ui.arcscord.dev/components) ·
[Playground](https://ui.arcscord.dev/playground)

Version **0.1.0** is available on [npm](https://www.npmjs.com/package/@arcscord/discord-ui).
See [installation](https://ui.arcscord.dev/docs/installation) to get started.

## Features

- Messages with Discord Markdown, embeds, media, attachments and replies.
- Components V2, buttons, select menus and reactions.
- Channels, threads and a composer with slash-command input.
- Light, Ash and Dark themes with scoped CSS and customizable tokens.
- Serializable display data and intent callbacks; your application owns network calls and persistence.

Independent of the Arcscord bot framework. Requires **React 19**; no Tailwind setup,
global reset or remote fonts are needed.

## First message

After [setting up the package](https://ui.arcscord.dev/docs/installation), import
its components and compiled stylesheet:

```tsx
import type { MessageView } from "@arcscord/discord-ui";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

const message: MessageView = {
  id: "hello",
  author: { id: "bot", displayName: "Example Bot", bot: true },
  timestamp: "2026-11-01T10:24:00Z",
  body: { kind: "markdown", content: "Hello from **React**!" },
};

export default function App(): React.ReactElement {
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      <Message message={message} />
    </DiscordUI>
  );
}
```

See the [package README](./packages/discord-ui/README.md) for theme options and
links to the API guides.

## Development

Use **Node 26.x** and **pnpm 12.16.1** (declared in `package.json`). From the repository root:

```sh
pnpm install --frozen-lockfile
pnpm dev
```

The site starts at [localhost:3000](http://127.0.0.1:3000). Rebuild with
`pnpm build:lib` after changing library sources; the website consumes compiled exports.

- [Contributing](./CONTRIBUTING.md): setup, repository layout and validation commands.
- [Website development](./apps/website/README.md): documentation and example sources.
- [CI and npm releases](./docs/maintainers/releases.md) · [Website deployment](./docs/maintainers/deployment.md).

## License

[MIT](./LICENSE) © 2026 Arcoz0308. See
[third-party notices](./packages/discord-ui/THIRD_PARTY_NOTICES) for renderer provenance and licenses.
