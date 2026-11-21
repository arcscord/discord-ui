# Changelog

## 0.1.1

### Fixed

- Render inline Markdown, emoji, spoilers and timestamps in embed titles and
  field names, with plain-text accessible embed names.
- Tint role mention backgrounds and hover states using the supplied role color.
- Require Core `^0.3.1` and include its corrected embed field-name styles.

## 0.1.0 — initial Svelte adapter

It requires Core `^0.3.0`.

- Add native Svelte 5 components for Discord message interfaces, channels and threads.
- Share display models, theme presets and scoped CSS with the core package.
- Add typed callbacks, snippet composition, optional syntax highlighting and SSR examples.
- Render video, audio, voice notes and stickers with remote-media filtering and spoilers.
- Add mentioned-message highlighting, author server tags and user/mention/message
  context-menu callbacks with keyboard support.
- Verify packed consumers with minimum/current Svelte versions and SvelteKit SSR
  and Chromium hydration using synthetic data.
