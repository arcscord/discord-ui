<script lang="ts">
  import type { MessageView } from "@arcscord/discord-ui-svelte";
  import { DiscordUI, Message } from "@arcscord/discord-ui-svelte";
  import { HighlightedCode } from "@arcscord/discord-ui-svelte/highlight";
  import "@arcscord/discord-ui-svelte/styles.css";

  const message: MessageView = {
    id: "welcome",
    author: { id: "bot", displayName: "Field Guide", bot: true },
    timestamp: "2026-11-01T10:24:00Z",
    edited: true,
    body: {
      kind: "markdown",
      content: [
        "**Welcome to the trail.** ||Bring a map!||",
        "",
        "```ts",
        "const distance = 12;",
        "```",
      ].join("\n"),
    },
    embeds: [
      {
        id: "trail",
        title: "North Ridge Trail",
        description: "Follow the **blue markers** to the overlook.",
        color: "#5865f2",
        image: {
          id: "ridge",
          url: "/examples/landscape.svg",
          alt: "Mountain ridge at dusk",
          width: 600,
          height: 320,
        },
      },
    ],
  };
</script>

<DiscordUI theme="dark" locale="en-US" timeZone="UTC" referenceTime="2026-11-01T10:25:00Z">
  {#snippet renderCode(content: string, language: string)}
    <HighlightedCode {content} {language} />
  {/snippet}
  <Message {message} />
</DiscordUI>
