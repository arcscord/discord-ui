# Changelog

## 0.3.0

### Added

- Convert received Discord API messages, channels, threads and resolved entities
  through the optional `@arcscord/discord-ui-core/discord-api` entry.
- Add video, audio, voice-note and sticker display models, including waveform,
  duration, poster and unsupported sticker-format metadata.
- Add viewer-supplied mentioned-message state, semantic highlight tokens and
  author server tags with optional badge images.
- Share user, mention and message interaction contracts across the adapters.
- Update `discord-api-types` to the `0.38.60` baseline.

### Migration from 0.2.x

- `MessageContentView.media` and `GalleryView.items` accept images and videos.
  Custom renderers must narrow `MessageMediaView` before reading image-only data.
- `MessageContentView.attachments` accepts `FileView | AudioView`. Handle the
  audio branch before passing file values to a file renderer.
- `fromDiscordMessage` classifies recognized audio attachments as audio and moves
  recognized video attachments into `media`. Review custom attachment filters.
- Adapters using these contracts require Core `^0.3.0`. Publish and approve this
  Core version before staging React `0.4.0`, Vue `0.2.0` or Svelte `0.1.0`.

## 0.2.0 — initial core extraction

- Extract framework-independent display models, callback contracts, configuration
  defaults, URL/date/select helpers, theme tokens and scoped CSS from the React package.
- Add renderer-neutral Markdown blocks, Unicode emoji segments and optional code
  highlighting tokens through separate entries.
- Allow applications to permit specific HTTP(S) media sources when remote media
  is disabled.
- Introduce independent core versions and `core-vX.Y.Z` release tags. React keeps
  its public imports and depends on a compatible core range.
- No Vue, Angular or Svelte renderer is included or claimed compatible.
