<script lang="ts">
  import type { ChannelType } from "@arcscord/discord-ui-core";
  import { channelIconPaths, resolveChannelIcon } from "@arcscord/discord-ui-core";
  import { getDisplayOptions } from "../display-context.js";

  const { channelType, rules, locked }: { channelType?: ChannelType | undefined; rules?: boolean | undefined; locked?: boolean | undefined } = $props();
  const display = getDisplayOptions();
  const resolved = $derived(resolveChannelIcon({ channelType, rules }, display().icons));
  const lockIcon = $derived(display().icons?.locked);
</script>

<span class="dui-select-channel-icon" aria-hidden="true">
  {#if resolved.icon}
    {@render resolved.icon()}
  {:else}
    <svg viewBox="0 0 24 24" fill="none"><path d={resolved.path} stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" /></svg>
  {/if}
  {#if locked}
    {#if lockIcon}
      <span class="dui-select-channel-lock">{@render lockIcon()}</span>
    {:else}
      <svg class="dui-select-channel-lock" viewBox="0 0 12 14"><path d={channelIconPaths.locked} fill="var(--discord-ui-channel-icon-background, var(--discord-ui-background))" stroke="currentColor" stroke-width="2" /></svg>
    {/if}
  {/if}
</span>
