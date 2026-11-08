# Changelog

## 0.2.0

Configure Unicode emoji rendering without consumer patches, serve Twemoji locally
and give emoji-only buttons accessible names.

### Breaking behavior change

Unicode emoji now render as native device text by default. The library no longer
implicitly loads Twemoji from jsDelivr. Applications relying on the previous image
appearance must configure an explicit Twemoji source.

### Added

- `DiscordUI.unicodeEmoji` and the exported `UnicodeEmojiOptions` type:
  `{ mode: "native" }` or `{ mode: "twemoji", baseUrl: string }`.
- Self-hosted Twemoji SVGs across plain text, Markdown, reactions, button emoji and
  select options. Code blocks and inline code remain literal.
- Root-relative Twemoji sources work with `allowRemoteMedia={false}`. Explicit
  HTTP(S) sources remain subject to the remote-media policy.
- Optional `ariaLabel` on button models and the `Button`/`LinkButton` primitives.
  Emoji-only model buttons fall back to the supplied emoji name. Primitive emoji
  slots remain exposed to assistive technology when no text label or override
  supplies their accessible name.

### Fixed

- Blocked, missing or failed Twemoji images fall back to the original Unicode
  emoji, including failures occurring before hydration installs event handlers.
- Custom emoji also recover image failures occurring before hydration, using
  their `:name:` fallback. Resolved local images and animated GIFs remain supported.

### Migration from 0.1.0

After publication, update the dependency:

```sh
pnpm add @arcscord/discord-ui@0.2.0
```

To preserve a Twemoji image appearance, serve a compatible SVG asset set from your
application's public directory and configure its root-relative URL:

```tsx
import { DiscordUI, Markdown } from "@arcscord/discord-ui";
import React from "react";
import "@arcscord/discord-ui/styles.css";

export default function Preview(): React.ReactElement {
  return (
    <DiscordUI
      unicodeEmoji={{ mode: "twemoji", baseUrl: "/emojis/twemoji-16.0.1" }}
      allowRemoteMedia={false}
    >
      <Markdown content="Hello 👋 ❤️" />
    </DiscordUI>
  );
}
```

`baseUrl` points directly to the directory containing lowercase, hyphenated
Twemoji codepoint filenames, such as `1f44b.svg` and `2764.svg`. Supply the assets;
the library does not bundle or download them. Keep the Twemoji graphics CC-BY 4.0
attribution. Missing glyphs in older asset sets fall back to native text. Use
`{ mode: "native" }` when device emoji are preferred.

For emoji-only primitive buttons, provide a meaningful `ariaLabel` describing the
action. Model buttons can use that override or their emoji's supplied name.
Consumers can replace patches for these behaviors with this public configuration
and metadata; their own integration still needs validation.

### Validation and scope

Regression coverage includes complex Unicode sequences, local custom GIF sources,
remote-media restrictions, accessible button names and image-failure fallbacks.
SSR and browser hydration are exercised on the Docusaurus site in desktop and
narrow Chromium viewports. This is not a dedicated Next.js App Router hydration
test, real-device coverage or a live Discord integration.
