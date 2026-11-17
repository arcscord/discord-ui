<script lang="ts">
  import type { MessageView, ThemeName } from "@arcscord/discord-ui-svelte";
  import { DiscordUI, Message } from "@arcscord/discord-ui-svelte";
  import { defineTheme } from "@arcscord/discord-ui-svelte/themes";
  import "@arcscord/discord-ui-svelte/styles.css";

  let base = $state<ThemeName>("ash");
  const theme = $derived(defineTheme({
    name: "ridge",
    extends: base,
    tokens: { accent: "#5865f2" },
  }));
  const message: MessageView = {
    id: "ridge",
    author: { id: "guide", displayName: "Field Guide" },
    timestamp: "2026-11-01T10:24:00Z",
    body: { kind: "markdown", content: "Each preview owns its theme and media policy." },
    media: [
      {
        id: "photo",
        url: "https://ui.arcscord.dev/examples/landscape.svg",
        alt: "Remote mountain illustration",
        width: 600,
        height: 320,
      },
    ],
  };
</script>

<p>
  <label>Base theme
    <select bind:value={base}>
      <option value="light">Light</option>
      <option value="ash">Ash</option>
      <option value="dark">Dark</option>
    </select>
  </label>
</p>
<DiscordUI {theme} locale="fr-FR" timeZone="Europe/Zurich" labels={{ mediaUnavailable: "Média indisponible" }}>
  <Message {message} />
</DiscordUI>
