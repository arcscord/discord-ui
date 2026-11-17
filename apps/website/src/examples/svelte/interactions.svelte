<script lang="ts">
  import type { ComponentInteractionContext, MessageView, SelectValues } from "@arcscord/discord-ui-svelte";
  import { DiscordUI, Message } from "@arcscord/discord-ui-svelte";
  import "@arcscord/discord-ui-svelte/styles.css";

  let selectValues = $state<SelectValues>({ topics: [] });
  let lastEvent = $state("Ready");
  let reacted = $state(false);
  const message: MessageView = $derived({
    id: "trail-poll",
    author: { id: "bot", displayName: "Field Guide", bot: true },
    timestamp: "2026-11-01T10:24:00Z",
    body: {
      kind: "components-v2",
      components: [
        {
          id: "card",
          kind: "container",
          accentColor: "#5865f2",
          components: [
            { id: "summary", kind: "text-display", content: "**What should we cover next?**" },
            {
              id: "topics-row",
              kind: "action-row",
              select: {
                id: "topics",
                kind: "string-select",
                placeholder: "Choose topics",
                minValues: 0,
                maxValues: 2,
                options: [
                  { value: "maps", label: "Maps", default: true },
                  { value: "gear", label: "Gear" },
                ],
              },
            },
            {
              id: "button-row",
              kind: "action-row",
              buttons: [
                { id: "submit", kind: "button", label: "Submit vote" },
              ],
            },
          ],
        },
      ],
    },
    reactions: [
      {
        id: "thumb",
        emoji: { name: "👍" },
        count: reacted ? 2 : 1,
        me: reacted,
      },
    ],
  });

  function select(id: string, values: string[], context: ComponentInteractionContext): void {
    selectValues = { ...selectValues, [id]: values };
    lastEvent = `Topics in ${context.messageId}: ${values.join(", ") || "none"}`;
  }
</script>

<DiscordUI theme="ash">
  <Message {message} {selectValues} onSelectChange={select}
           onButtonClick={(_id, context) => lastEvent = `Vote submitted for ${context.messageId}`}
           onReactionToggle={() => reacted = !reacted} />
</DiscordUI>
<p role="status">{lastEvent}</p>
