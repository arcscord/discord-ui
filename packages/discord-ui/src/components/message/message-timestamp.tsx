import { useDisplayOptions } from "../display-context";

export function MessageTimestamp({ timestamp }: { timestamp: string }) {
  const { locale, timeZone, labels } = useDisplayOptions();
  const date = new Date(timestamp);
  if (!/T.*(?:Z|[+-]\d{2}:\d{2})$/u.test(timestamp) || !Number.isFinite(date.valueOf()))
    return <span className="dui-timestamp">{labels.invalidTimestamp}</span>;
  const label = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(date);
  return <time className="dui-timestamp" dateTime={date.toISOString()} title={label}>{label}</time>;
}
