<script lang="ts">
  import { demoChannel } from "../../../fixtures/channel.js";
  import { componentsV2Message, demoEntities, embedMessage, markdownMessage, mediaMessage, unavailableMessage } from "../../../fixtures/messages.js";
  import { selectMenuExamples } from "../../../fixtures/select-menus.js";
  import { HighlightedCode } from "../src/highlight.js";
  import { ChannelView, DiscordUI, Markdown, Message, SelectMenu } from "../src/index.js";
  import { defineTheme } from "../src/themes.js";

  const theme = defineTheme({
    name: "fixture",
    extends: "ash",
    tokens: { accent: "#7733aa" },
  });
  const image = "https://cdn.example.test/avatar.png";
  const remote = {
    ...unavailableMessage,
    author: { ...unavailableMessage.author, avatarUrl: image },
  };
  const tag = "script";
  const unsafeContent = `<${tag}>sentinel(1);</${tag}> [unsafe](javascript:sentinel(1))  <t:0:R>`;
  const { locale = "en-US" }: { locale?: string } = $props();
</script>

<DiscordUI {theme} {locale} timeZone="UTC" referenceTime="2026-10-29T18:00:00Z" entities={demoEntities} allowRemoteMedia={false}>
  {#snippet renderCode(content: string, language: string)}
    <HighlightedCode {content} {language} />
  {/snippet}
  <Message message={markdownMessage} />
  <Message message={componentsV2Message} />
  <Message message={embedMessage} />
  <Message message={mediaMessage} />
  <Message message={remote} />
  {#each selectMenuExamples as example (example.menu.id)}
    <SelectMenu menu={example.menu} />
  {/each}
  <SelectMenu menu={{
    id: "controlled",
    kind: "string-select",
    options: [
      { value: "hidden", label: "Default hidden", default: true },
    ],
  }}
              values={[]} />
  <DiscordUI theme="light" allowRemoteMedia={false} remoteMediaAllowlist={[image]} labels={{ edited: "Adjusted" }}>
    <Message message={{ ...remote, edited: true }} />
  </DiscordUI>
  <ChannelView channel={demoChannel} activeThreadId="thread-landscape" />
</DiscordUI>

<Markdown content={unsafeContent} />
