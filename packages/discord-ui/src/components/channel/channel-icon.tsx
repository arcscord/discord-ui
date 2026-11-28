import type { ChannelType } from "@arcscord/discord-ui-core";
import { channelIconPaths, resolveChannelIcon } from "@arcscord/discord-ui-core";
import { createElement } from "react";
import { useDisplayOptions } from "../display-context";

/** Shared native renderer for channel headers, sidebar rows and select options. */
export function ChannelIcon({ channelType = 0, rules, locked }: {
  channelType?: ChannelType | undefined;
  rules?: boolean | undefined;
  locked?: boolean | undefined;
}) {
  const { icons } = useDisplayOptions();
  const { path, icon: Icon } = resolveChannelIcon({ channelType, rules }, icons);
  const Lock = icons?.locked;
  return (
    <span className="dui-select-channel-icon" aria-hidden="true">
      {Icon
        ? createElement(Icon)
        : <svg viewBox="0 0 24 24" fill="none"><path d={path} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
      {locked && (Lock
        ? <span className="dui-select-channel-lock"><Lock /></span>
        : <svg className="dui-select-channel-lock" viewBox="0 0 12 14"><path d={channelIconPaths.locked} fill="var(--discord-ui-channel-icon-background, var(--discord-ui-background))" stroke="currentColor" strokeWidth="2" /></svg>)}
    </span>
  );
}
