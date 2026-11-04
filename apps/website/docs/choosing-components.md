---
title: Choosing your components
description: Choose between Message, ChannelView, Thread and composable Discord UI components for previews, conversations and interactive examples.
---

# Choosing your components

Start with the most complete component that matches your interface. Use primitives
when you need to own the layout. Keep a `DiscordUI` wrapper around your composition
for the shared theme, labels, locale and time zone.

| Your goal | Component | Data and responsibilities | Example |
| --- | --- | --- | --- |
| One complete message | `Message` | A `MessageView`; callbacks for interactions | [Message](/components?example=message) |
| A transcript in your own layout | `MessageList` | Ordered `messages`; optional date separators; your layout owns scrolling | [Message list](/components?example=message-list) |
| A full channel | `ChannelView` | A `ChannelViewModel`; header, scrolling history, composer and loaded thread navigation | [Channel](/components?example=channel-view) |
| A standalone thread | `ThreadPanel` | A `ThreadView`, optional parent message, close/send handlers | [Thread panel](/components?example=thread-panel) |
| A thread summary inside another view | `ThreadPreview` | A thread summary and optional open callback | [Thread preview](/components?example=thread-preview) |
| A custom message layout | `MessageFrame`, `MessageHeader`, `MessageContent` | Compose the message parts yourself | [Message frame](/components?example=message-frame) |
| A standalone piece of content | `Markdown`, `Embed`, `Media`, `MediaGallery` | Supply the content or model for that component | [Markdown](/components?example=markdown) |
| A Components V2 model | `MessageComponents` | Serializable component tree and interaction handlers | [Components](/components?example=message-components) |
| A custom component layout | `Container`, `Section`, `TextDisplay`, `ActionRow`, `Button`, `SelectMenu` and other primitives | Compose React children and supply props directly | [Container](/components?example=container) |

## Message or MessageList?

`Message` renders one message, including its author, body and supported optional
metadata. `MessageList` renders messages in the supplied order and can insert date
separators. It does not add a channel header, composer or scrolling viewport.

## MessageList or ChannelView?

Choose `ChannelView` when you want the full channel shell. Set `composer={false}`
for a read-only channel; provide `onSend` when your application accepts sends.
`onSend` reports text: the application must append the resulting message to the
channel data. It does not automatically persist messages or contact Discord.

`ChannelView` can wrap itself in `DiscordUI` when used alone. An explicit outer
wrapper is still useful to set the same display options as the rest of your app.

## ChannelView or ThreadPanel?

`ChannelView` opens loaded threads linked from parent messages. Supply threads
in the channel model; navigation does not fetch missing data. Use `ThreadPanel`
inside `DiscordUI` when the thread lives in your own page or panel.

Local navigation is available by default. For application-controlled navigation,
see [interaction state](./public-api.md#conversation-identity-and-thread-navigation).

## Models or primitives?

Use `Message` and `MessageComponents` when your application stores serializable
snapshots. Use the smaller components when your React tree needs custom layout or
behavior. A classic message and a Components V2 message have different model
constraints; see [message bodies](./concepts.md#classic-messages-and-components-v2).

All component examples have an **Open in playground** link in the catalogue.
[Browse the guide directory](./guides.md) once you have chosen your composition.
