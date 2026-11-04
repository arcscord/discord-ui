---
title: API reference
description: Explore typed React props, serializable display models, callbacks, theme helpers and runnable examples for the Discord UI public API.
---

# API reference directory

This reference covers all public exports, with extracted signatures and field
tables, authored behavior/default notes, typed data examples and complete runnable
component modules. Start with [Choosing your components](./choosing-components.md)
for usage. Use the family links below to inspect contracts.

Regenerate checked-in reference pages with `pnpm docs:api` after changing a public
contract; `pnpm docs:api:check` verifies coverage and compiles data examples against
the built public imports. A new public symbol requires an authored description and
example before generation succeeds.

## Public entry points

[Read the public entry points reference](./api/entry-points.mdx).

Use the root package for components and models, `/styles.css` for compiled CSS,
`/themes` for theme helpers and `/highlight` for opt-in highlighting. See
[installation](./installation.md#public-entry-points) for exact import paths.

## Display components

[Read the display components reference](./api/display-components.mdx).

`DisplayOptions`, `UILabels`, `Author`, `AuthorProps`, `Avatar`, `AvatarProps`, `Emoji`, `EmojiProps`, `Markdown`, `MarkdownProps`, `Mention`, `MentionProps`, `DiscordUI`, `DiscordUIProps`, `Embed`, `EmbedProps`, `Media`, `MediaProps`, `MediaGallery`, `MediaGalleryProps`, `Message`, `MessageProps`, `MessageContent`, `MessageContentProps`, `MessageFrame`, `MessageFrameProps`, `MessageHeader`, `MessageHeaderProps`, `MessageTimestamp`, `MessageTimestampProps`, `ReplyPreview`, `ReplyPreviewProps`.

## Interactive components

[Read the interactive components reference](./api/interactive-components.mdx).

`MessageComponents`, `MessageComponentsProps`, `ActionRow`, `Button`, `Container`, `File`, `LinkButton`, `Section`, `Separator`, `TextDisplay`, `Thumbnail`, `ActionRowProps`, `ButtonProps`, `ContainerProps`, `FileProps`, `LinkButtonProps`, `SectionProps`, `SeparatorProps`, `TextDisplayProps`, `ThumbnailProps`, `SelectMenu`, `SelectMenuProps`, `Spoiler`, `SpoilerProps`, `Reactions`, `ReactionsProps`.

## Conversation components

[Read the conversation components reference](./api/conversation-components.mdx).

`ChannelComposer`, `ChannelComposerProps`, `ChannelHeader`, `ChannelHeaderProps`, `ChannelView`, `ChannelViewProps`, `MessageList`, `MessageListProps`, `ThreadPanel`, `ThreadPanelProps`, `ThreadPreview`, `ThreadPreviewProps`.

## Serializable models

[Read the serializable models reference](./api/models.mdx).

`ChannelViewModel`, `ActionRowView`, `ButtonView`, `ChannelSelectMenuView`, `ChannelSelectOptionView`, `ComponentsV2Body`, `ContainerChild`, `ContainerView`, `FileView`, `GalleryView`, `LinkButtonView`, `MentionableSelectMenuView`, `MessageButtonView`, `MessageComponent`, `PremiumButtonView`, `RoleSelectMenuView`, `RoleSelectOptionView`, `SectionView`, `SelectChannelType`, `SelectDefaultValue`, `SelectMenuView`, `SelectOptionView`, `SeparatorView`, `StringSelectMenuView`, `StringSelectOptionView`, `TextDisplayView`, `ThumbnailView`, `UserSelectMenuView`, `UserSelectOptionView`, `EmbedView`, `EntityView`, `MarkdownMessageBody`, `MediaView`, `MessageEntities`, `ChannelEntityView`, `ChannelType`, `RoleView`, `UserView`, `AvatarFallback`, `InteractionReplyView`, `MessageAuthor`, `MessageContentView`, `MessageMetadata`, `MessageReplyView`, `MessageView`, `ReplyView`, `TextMessageBody`, `ReactionView`, `SlashCommand`, `SlashCommandArgument`, `SlashCommandInvocation`, `ThreadMessageView`, `ThreadSummaryView`, `ThreadView`.

## Interaction callbacks

[Read the interaction callbacks reference](./api/callbacks.mdx).

`ComponentHandlers`, `ComponentInteractionContext`, `SelectValues`, `SelectValuesByMessage`, `ReactionToggleHandler`, `SlashCommandHandler`.

Read [Interaction state](./public-api.md) for callback arguments and controlled selections.

## Theme helpers and tokens

[Read the theme helpers and tokens reference](./api/themes.mdx).

`defineTheme`, `themes`, `themeTokenProperties`, `DiscordTheme`, `ThemeInput`, `ThemeName`, `ThemeOverrides`, `ThemeTokens`.

The `@arcscord/discord-ui/themes` entry point also exports `resolveTheme` and
`themeStyle` for resolving a theme and mapping token values to CSS properties.

## Optional syntax highlighting

[Read the optional syntax highlighting reference](./api/highlight.mdx).

Import `renderHighlightedCode` from `@arcscord/discord-ui/highlight` and pass it
as `DiscordUI.renderCode` to opt in. It accepts content and a language, and returns
React content. The root component import does not enable syntax highlighting.
