# Changelog

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
