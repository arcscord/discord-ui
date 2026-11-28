import type { ChannelType } from "@arcscord/discord-ui-core";
import { channelIconPaths, resolveChannelIcon } from "@arcscord/discord-ui-core";
import { h, toRaw } from "vue";
import { defineRenderer } from "../../rendering";

type ChannelIconProps = {
  channel: { channelType?: ChannelType | undefined; locked?: boolean | undefined; rules?: boolean | undefined };
};

export const ChannelIcon = defineRenderer<ChannelIconProps, ChannelIconProps, Record<string, never>>("ChannelIcon", ["channel"], [], (input, display) => () => {
  const { channel } = input();
  const { path, icon } = resolveChannelIcon(channel, display.icons);
  return (
    <span class="dui-select-channel-icon" aria-hidden="true">
      {icon
        ? h(toRaw(icon))
        : <svg viewBox="0 0 24 24" fill="currentColor"><path d={path} fill-rule="evenodd" /></svg>}
      {channel.locked
        ? display.icons?.locked
          ? <span class="dui-select-channel-lock">{h(toRaw(display.icons.locked))}</span>
          : <svg class="dui-select-channel-lock" viewBox="0 0 12 14"><path d={channelIconPaths.locked} fill="currentColor" fill-rule="evenodd" stroke="var(--discord-ui-channel-icon-background, var(--discord-ui-background))" stroke-width="1.5" stroke-linejoin="round" paint-order="stroke" /></svg>
        : null}
    </span>
  );
});
