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

const text = "M8.1 2 7.2 7H3v3h3.7l-.8 4H2v3h3.3l-.9 5h3.1l.9-5h5l-.9 5h3.1l.9-5H21v-3h-3.7l.8-4H22V7h-3.3l.9-5h-3.1l-.9 5h-5l.9-5H8.1Zm2 8h5l-.8 4h-5l.8-4Z";
const direct = "M5 3a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2v3l5-3h7a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H5Z";
const voice = "M11 3.5 5.5 8H2a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h3.5l5.5 4.5a1 1 0 0 0 1.6-.8V4.3a1 1 0 0 0-1.6-.8Zm4 4.3a6 6 0 0 1 0 8.4l1.5 1.5a8 8 0 0 0 0-11.4L15 7.8Zm3.1-3.1a10.3 10.3 0 0 1 0 14.6l1.5 1.5a12.3 12.3 0 0 0 0-17.6l-1.5 1.5Z";
const category = "m3.3 8.5 7.6 7.6a1.6 1.6 0 0 0 2.2 0l7.6-7.6-2.2-2.2L12 12.8 5.5 6.3l-2.2 2.2Z";
const announcement = "M19 2a2 2 0 0 0-1 .3L7 8H5v8h2l2 5h4l-1.5-5H13l5 2.7a2 2 0 0 0 3-1.8V4a2 2 0 0 0-2-2ZM1 9v6a1 1 0 0 0 1 1h1V8H2a1 1 0 0 0-1 1Z";
const thread = "M6 2 5 6H2v3h2.3l-.7 3H1v3h1.9L2 19h3l.9-4H9v-3H6.6l.7-3h4.2l-.5 2h3l.5-2H18V6h-2.8l1-4h-3l-1 4H8l1-4H6Zm7 11a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h2v2l3-2h3a2 2 0 0 0 2-2v-5a2 2 0 0 0-2-2h-8Z";
const stage = "M12 1a11 11 0 0 0-7.8 18.8l1.5-1.5a9 9 0 1 1 12.6 0l1.5 1.5A11 11 0 0 0 12 1Zm0 4a7 7 0 0 0-5 12l1.5-1.5a5 5 0 1 1 7 0L17 17a7 7 0 0 0-5-12Zm0 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0 8a6 6 0 0 0-6 6h12a6 6 0 0 0-6-6Z";
const directory = "M5 3a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h2v3l5-3h7a3 3 0 0 0 3-3V6a3 3 0 0 0-3-3H5Zm2 4h10v2H7V7Zm0 5h7v2H7v-2Z";
// The back bubble follows a larger arc around the front bubble, leaving a consistent gap.
const forum = "M9 1a8 8 0 0 0-6.8 12.2L1 18l4.8-1.2A8 8 0 0 0 9.5 17a7.5 7.5 0 0 1 7.5-7.5A8 8 0 0 0 9 1Zm8 10a6 6 0 0 1 5.2 9L23 23l-3-.8A6 6 0 1 1 17 11Z";
const media = "M4 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4Zm1 14 5-6 4 4 3-3 3 5H5Zm11-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z";
const rules = "M5 2a2 2 0 0 0-2 2v15a3 3 0 0 0 3 3h15v-2H6a1 1 0 0 1-1-1h15V4a2 2 0 0 0-2-2H5Zm3.4 6.6L11 11.2l4.6-4.6 1.8 1.8L11 14.8l-4.4-4.4 1.8-1.8Z";
const locked = "M3 5V4a3 3 0 0 1 6 0v1h1a1 1 0 0 1 1 1v6a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1h1Zm1.5 0h3V4a1.5 1.5 0 0 0-3 0v1Z";

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
  13: stage,
  14: directory,
  15: forum,
  16: media,
};

/** Filled SVG paths using the evenodd fill rule. Adapters own native overrides. */
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
