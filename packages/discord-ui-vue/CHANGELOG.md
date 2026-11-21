# Changelog

## 0.2.0-beta.1 — beta

This version is prepared in the repository and awaits npm publication.

### Added

- Add native video, audio, voice-note and sticker rendering with accessible
  controls, spoilers and remote-media policy support.
- Add mentioned-message highlighting and author server tags.
- Add user, mention and message context-menu events across messages, replies,
  lists, channels and threads, with keyboard access and reactive handler updates.

### Migration from 0.1.x

- Require Core `^0.3.0-beta.1`. Custom media and attachment renderers must handle the
  expanded image/video and file/audio unions described in the Core changelog.

## 0.1.0 — initial Vue adapter

- Add native Vue rendering for every public React component, shared models and CSS.
- Add typed props, slots, events, v-model selections/composer and controlled threads.
- Support deterministic SSR/hydration, themes, Markdown, optional highlighting,
  media policies, emoji fallbacks, reactions, menus, commands and channel navigation.
- Allow specific remote media sources and preserve the channel reading position
  during updates with the same messages.
- Add Vue documentation/demos, isolated minimum/current Vue consumer checks and
  independent `vue-vX.Y.Z` release staging.
