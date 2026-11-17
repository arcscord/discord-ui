<script module lang="ts">
  export type MessageTimestampProps = { timestamp: string };
</script>

<script lang="ts">
  import { parseTimestamp } from "@arcscord/discord-ui-core";
  import { getDisplayOptions } from "../display-context.js";

  const { timestamp }: MessageTimestampProps = $props();
  const display = getDisplayOptions();
  const date = $derived(parseTimestamp(timestamp));
  const format = $derived(new Intl.DateTimeFormat(display().locale, { dateStyle: "medium", timeStyle: "short", timeZone: display().timeZone }));
</script>

{#if date}
  {@const label = format.format(date)}
  <time class="dui-timestamp" datetime={date.toISOString()} title={label}>{label}</time>
{:else}
  <span class="dui-timestamp">{display().labels.invalidTimestamp}</span>
{/if}
