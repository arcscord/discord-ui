<script lang="ts">
  import type { EmbedView } from "../src/index.js";

  import { DiscordUI, Embed } from "../src/index.js";

  const { url }: { url?: string | undefined } = $props();
  const embed: EmbedView = {
    id: "e",
    title: "<:id:974006684643127296> **Ticket** fermé <@123>",
    fields: [
      { id: "f", name: "<:id:974006684643127296> Ticket ID", value: "<:id:974006684643127296> 1" },
    ],
  };
</script>

<DiscordUI theme="dark" locale="fr-FR" timeZone="UTC" entities={{
  emojis: {
    "974006684643127296": { name: "id", image: "/emoji.svg" },
  },
}}>
  <Embed embed={url
    ? { ...embed, url }
    : embed} />
</DiscordUI>
