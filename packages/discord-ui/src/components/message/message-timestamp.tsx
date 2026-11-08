import { parseTimestamp } from "@arcscord/discord-ui-core";
import { useDisplayOptions } from "../display-context";

export type MessageTimestampProps = { timestamp: string };

export function MessageTimestamp({ timestamp }: MessageTimestampProps) {
  const { locale, timeZone, labels } = useDisplayOptions();
  const date = parseTimestamp(timestamp);
  if (!date)
    return <span className="dui-timestamp">{labels.invalidTimestamp}</span>;
  const label = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(date);
  return <time className="dui-timestamp" dateTime={date.toISOString()} title={label}>{label}</time>;
}
