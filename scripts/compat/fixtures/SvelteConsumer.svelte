<script lang="ts">
  import type { MessageView, SelectMenuProps, ThreadSummaryView } from "@arcscord/discord-ui-svelte";
  import { ChannelComposer, DiscordUI, Message, SelectMenu, ThreadPreview } from "@arcscord/discord-ui-svelte";
  import { HighlightedCode } from "@arcscord/discord-ui-svelte/highlight";
  import { defineTheme } from "@arcscord/discord-ui-svelte/themes";
  import { onMount } from "svelte";
  import "@arcscord/discord-ui-svelte/styles.css";

  const timestamp = "2026-11-01T10:24:00Z";
  const theme = defineTheme({
    name: "packed",
    extends: "ash",
    tokens: { accent: "#7733aa" },
  });
  const message: MessageView = {
    id: "packed",
    author: { id: "bot", displayName: "Packed Bot" },
    timestamp,
    body: {
      kind: "markdown",
      content: [
        "**Packed message**",
        "",
        "```ts",
        "const x = 1;",
        "```",
      ].join("\n"),
    },
  };
  const thread: ThreadSummaryView = { id: "thread", name: "Packed thread", messageCount: 0 };
  const menu: SelectMenuProps["menu"] = {
    id: "user",
    kind: "user-select",
    minValues: 0,
    maxValues: 2,
    placeholder: "Packed users",
    entities: [
      {
        entityType: "user",
        id: "a",
        displayName: "Alpha",
        username: "alpha",
      },
      {
        entityType: "user",
        id: "b",
        displayName: "Beta",
        username: "beta",
      },
    ],
  };
  let values = $state<string[]>([]);
  let draft = $state("");
  let status = $state("Ready");
  let hydrated = $state(false);
  onMount(() => {
    hydrated = true;
  });
</script>

<div data-hydrated={hydrated}>
  <DiscordUI {theme} referenceTime={timestamp} locale="en-US" timeZone="UTC">
    {#snippet renderCode(content: string, language: string)}
      <HighlightedCode {content} {language} />
    {/snippet}
    <Message {message} />
    <ThreadPreview {thread} onOpen={() => status = "Opened"} />
    <SelectMenu {menu} {values} onChange={next => values = next} />
    <ChannelComposer channelName="packed" value={draft} onValueChange={next => draft = next} onSend={(content) => {
      status = `Sent: ${content}`;
      draft = "";
    }} />
  </DiscordUI>
  <p role="status">{status}</p>
</div>
