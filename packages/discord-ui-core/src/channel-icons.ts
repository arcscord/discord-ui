import type { UILabels } from "./display-options";
import type { ChannelType } from "./model/entities";
import { defaultDisplayOptions } from "./display-options";

/** Native adapter components/snippets, separate from serializable theme tokens. */
export type ChannelIcons<Icon> = {
  /** Keys are Discord channel type numbers or application-defined type names. */
  channelTypes?: Readonly<Record<string, Icon>>;
  rules?: Icon;
  locked?: Icon;
};

const text = "M10 3 6 21M18 3l-4 18M3 9h18M1 15h18";
const direct = "M4 4h16v12H9l-5 4V4Z";
const voice = "m3 9 5 0 5-5v16l-5-5H3V9Zm13-1c3 2 3 6 0 8m3-11c5 4 5 10 0 14";
const category = "m4 9 8 7 8-7";
const announcement = "M3 9h4l12-5v16L7 15H3V9Zm4 6 2 6h4l-2-4";
const thread = "M6 3 3 17M13 3l-3 14M1 7h16M0 13h11M13 13h9v6h-4l-3 3v-3h-2v-6Z";
const forum = "M3 4h18v13H10l-5 4v-4H3V4Zm4 5h10M7 13h7";
const media = "M3 4h18v16H3V4Zm0 13 6-6 4 4 3-3 5 5M15 8h2";
const rules = "M5 3h14v16H5V3Zm-3 4v15h17M8 10l3 3 5-6";
const locked = "M3 6V4a3 3 0 0 1 6 0v2M2 6h8v7H2Z";

const channelTypePaths: Readonly<Record<string, string>> = {
  0: text,
  1: direct,
  2: voice,
  3: direct,
  4: category,
  5: announcement,
  10: thread,
  11: thread,
  12: thread,
  13: voice,
  14: forum,
  15: forum,
  16: media,
};

/** Shared SVG path data. Adapters own the SVG elements and native overrides. */
export const channelIconPaths: Readonly<Record<string, string>> = { ...channelTypePaths, rules, locked };

/** Resolve native overrides and built-in path data without inherited object keys. */
export function resolveChannelIcon<Icon>(
  channel: { channelType?: ChannelType | undefined; rules?: boolean | undefined },
  icons?: ChannelIcons<Icon>,
): { path: string; icon: Icon | undefined } {
  const key = String(channel.channelType ?? 0);
  const overrides = icons?.channelTypes;
  return {
    path: channel.rules
      ? rules
      : Object.hasOwn(channelTypePaths, key)
        ? channelTypePaths[key]!
        : text,
    icon: channel.rules
      ? icons?.rules
      : overrides && Object.hasOwn(overrides, key)
        ? overrides[key]
        : undefined,
  };
}

/** Unknown custom types retain a localized generic label until one is supplied. */
export function getChannelTypeLabel(channelType: ChannelType = 0, labels: UILabels = defaultDisplayOptions.labels): string {
  const typeLabels = labels.channelTypes ?? {};
  const defaults = defaultDisplayOptions.labels.channelTypes!;
  return (Object.hasOwn(typeLabels, channelType)
    ? typeLabels[channelType]
    : undefined)
  ?? (Object.hasOwn(defaults, channelType)
    ? defaults[channelType]
    : undefined)
  ?? labels.channel
  ?? defaultDisplayOptions.labels.channel!;
}
