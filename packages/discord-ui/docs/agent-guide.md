# Local integration guide

This guide and the declaration files ship with `@arcscord/discord-ui`, so they
track the installed package version and can be read without network access.
Start with [package instructions](../AGENTS.md). For exact prop names, unions,
callback signatures and optional fields, read the local declarations rather than
assuming compatibility with Discord send payloads.

## Entry points and reference

| Import | Purpose | Local reference |
| --- | --- | --- |
| `@arcscord/discord-ui` | React components, props and display models | [Declarations](../dist/index.d.mts) |
| `@arcscord/discord-ui/styles.css` | Precompiled, scoped stylesheet | [CSS](../dist/styles.css) |
| `@arcscord/discord-ui/themes` | Theme helpers and tokens, without a client entry banner | [Declarations](../dist/themes.d.mts) |
| `@arcscord/discord-ui/highlight` | Optional syntax highlighting | [Declarations](../dist/highlight.d.mts) |

The package is ESM and declares React `^19.0.0` as a peer dependency. The application
supplies React and its renderer. Do not infer support for every framework or React
version from the peer range. The repository's Node and pnpm versions are contributor
toolchain requirements, not additional application setup instructions.

## Render a message

Import the stylesheet once at the application's CSS entry point. The following
module is a complete basic integration; use the application's existing module and
CSS conventions when placing it.

```tsx
import type { MessageView } from "@arcscord/discord-ui";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

const message = {
  id: "hello",
  author: { id: "bot", displayName: "Example Bot", bot: true },
  timestamp: "2026-11-01T10:24:00Z",
  body: { kind: "markdown", content: "Hello from **React**!" },
} satisfies MessageView;

export default function Preview(): React.ReactElement {
  return (
    <DiscordUI theme="dark" locale="en-US" timeZone="UTC">
      <Message message={message} />
    </DiscordUI>
  );
}
```

`DiscordUI` provides the `.arcscord-discord-ui` style scope and display options.
The library uses `dui-` classes. It does not require Tailwind, a global reset or
remote fonts. `ChannelView` supplies a default wrapper when used outside a provider;
wrap it explicitly to customize display options.

The application's bundler handles the CSS import. If checking these examples with
bare TypeScript rather than framework tooling, include an ambient declaration
`declare module "@arcscord/discord-ui/styles.css";` in an application `.d.ts` file
when CSS side-effect import types are required.

## Choose the display model

- `MessageView` combines string `id`, resolved `author`, an ISO 8601 `timestamp`
  including a time zone, and a discriminated `body`.
- Classic bodies use `kind: "text"` or `kind: "markdown"` with `content`. They
  can also have top-level `embeds`, `media`, `attachments` and action-row `components`.
- Components V2 uses `body: { kind: "components-v2", components: [...] }`.
  Top-level `embeds`, `media`, `attachments` and `components` are forbidden on
  that variant. Put V2 content inside `body.components`.
- Action rows contain either `buttons` or one `select`. String selects use
  `options`; user, role, mentionable and channel selects use resolved `entities`.
  Read the corresponding union before building a menu.
- Use `edited: true` for the edit marker. `reply` is a message snapshot or
  interaction reply; `thread` is thread summary data, not a reply.
- `ephemeral` is a display hint, not access control. The host must filter private
  data before rendering it.

These are display contracts. Raw Discord payload fields such as `custom_id` and
numeric component types are not interchangeable with these models. There is no
Discord send-payload validator, connection, automatic entity lookup or persistence.
Normalize external data in the host application before rendering.

## Components V2 and callbacks

```tsx
import type { ComponentInteractionContext, MessageView } from "@arcscord/discord-ui";
import { DiscordUI, Message } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

const message = {
  id: "actions",
  author: { id: "bot", displayName: "Example Bot" },
  timestamp: "2026-11-01T10:24:00Z",
  body: {
    kind: "components-v2",
    components: [
      { id: "intro", kind: "text-display", content: "Choose an action." },
      {
        id: "row",
        kind: "action-row",
        buttons: [
          {
            id: "confirm",
            kind: "button",
            label: "Confirm",
            style: "primary",
          },
        ],
      },
    ],
  },
} satisfies MessageView;

export default function Actions({ onConfirm }: {
  onConfirm: (context: ComponentInteractionContext) => void;
}): React.ReactElement {
  return (
    <DiscordUI>
      <Message
        message={message}
        onButtonClick={(id, context) => {
          if (id === "confirm")
            onConfirm(context);
        }}
      />
    </DiscordUI>
  );
}
```

The host implements `onConfirm`, including any authorization, network request,
loading/error state and subsequent model update. Other interaction contracts:

- `onSelectChange(id, values, context)` reports selected string values.
  `context.messageId` identifies the message when rendered through `Message`,
  `MessageList`, `ChannelView` or `ThreadPanel`; standalone components may omit it.
- `Message.selectValues` controls selection by component ID. Conversation views
  use `selectValuesByMessage`, keyed first by message ID and then component ID.
  Missing selection keys use local state; an empty array controls an empty selection.
  Update controlled values in the application when receiving callbacks.
- `ChannelView.onSend(content)` reports submission; the host appends a new
  message to its model. Slash commands use `commands` and `onSlashCommand`.
- `ChannelView.activeThreadId` omitted enables local navigation; `null` explicitly
  closes a controlled thread. Controlled navigation needs updates through
  `onThreadOpen` and `onThreadClose`. Supply matching thread summaries on parent
  messages and thread records in `channel.threads`.
- Reactions and ephemeral dismissal also report intent. The host updates the
  corresponding model and owns persistence.

## Themes, media and server rendering

- Presets are `light`, `ash` and `dark` (default). Use `DiscordUI.tokens` for
  overrides or `defineTheme({ name, extends, tokens })` from the themes entry.
  Read `ThemeTokens` for supported semantic names instead of inventing CSS variables.
- `DiscordUI` accepts `locale`, `timeZone`, `referenceTime`, resolved `entities`
  and partial `labels`. Defaults are `en-US` and `UTC`. Keep these and initial
  message data identical between server rendering and hydration. Timestamps are
  explicit data; message-relative rendering falls back to the message timestamp.
- For highlighting, pass `renderCode={renderHighlightedCode}` to `DiscordUI`,
  importing the function from the optional highlight entry point.
- `allowRemoteMedia={false}` blocks remote image resources, including avatars
  and emoji. Preserve this setting when configured. It is not a general network
  sandbox for the host application or every link.
- Render content through the library's text/Markdown components. Do not turn
  message content into raw HTML injection.
- The component and highlight bundles carry client entry banners; the themes
  entry does not. Follow the host framework's client boundary rules for callbacks
  and interactive state. Successful static SSR does not prove hydration support.

## Verify an integration

Run the consuming application's typecheck and relevant rendering/interaction
checks. Inspect styling, keyboard focus and narrow layouts for affected views;
test controlled selections and thread navigation beyond a static screenshot.
For hydration issues, first compare server/client data and display options.
For missing styles, check the CSS import and wrapper.

The [online documentation](https://ui.arcscord.dev/docs/introduction) contains
additional guides and interactive examples, but may describe a different version.
Use the installed declarations as the exact API reference.
