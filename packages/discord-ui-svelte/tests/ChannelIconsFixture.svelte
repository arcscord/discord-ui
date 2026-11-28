<script lang="ts">
  import { ChannelHeader, ChannelList, DiscordUI, SelectMenu } from "../src/index.js";
</script>

{#snippet custom()}<svg data-icon="custom" viewBox="0 0 24 24"><path d="M1 1h2" /></svg>{/snippet}
{#snippet numeric()}<svg data-icon="numeric" viewBox="0 0 24 24"><path d="M2 2h3" /></svg>{/snippet}
{#snippet rules()}<svg data-icon="rules" viewBox="0 0 24 24"><path d="M3 3h4" /></svg>{/snippet}
{#snippet locked()}<svg data-icon="locked" viewBox="0 0 12 14"><path d="M4 4h5" /></svg>{/snippet}

<DiscordUI icons={{
  channelTypes: { custom, 2: numeric },
  rules,
  locked,
}} labels={{
  channelTypes: { custom: "Custom room", 2: "Voice room" },
}}>
  <ChannelHeader name="Header name" channelType="custom" locked />
  <ChannelList categories={[
    {
      id: "category",
      channels: [
        {
          id: "custom",
          name: "Custom row",
          channelType: "custom",
          locked: true,
        },
        { id: "voice", name: "Voice row", channelType: 2 },
        {
          id: "rules",
          name: "Rules row",
          channelType: 0,
          rules: true,
        },
        { id: "stage", name: "Stage row", channelType: 13 },
        { id: "media", name: "Media row", channelType: 16 },
      ],
    },
  ]} />
  <SelectMenu menu={{
    id: "channels",
    kind: "channel-select",
    entities: [
      {
        entityType: "channel",
        id: "custom",
        name: "Custom option",
        channelType: "custom",
        locked: true,
      },
    ],
    defaultValues: [
      { id: "custom", type: "channel" },
    ],
  }} />
</DiscordUI>
