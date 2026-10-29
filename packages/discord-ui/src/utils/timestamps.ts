export function formatDiscordTimestamp(seconds: string, format: string, options: { locale: string; timeZone: string; referenceTime: string }): { dateTime: string; label: string } | undefined {
  const value = Number(seconds);
  const date = new Date(value * 1000);
  if (!Number.isFinite(value) || !Number.isFinite(date.valueOf()))
    return undefined;
  const { locale, timeZone } = options;
  let label: string;
  if (format === "R") {
    const reference = new Date(options.referenceTime).valueOf();
    if (!Number.isFinite(reference))
      return undefined;
    const difference = (date.valueOf() - reference) / 1000;
    const units: [Intl.RelativeTimeFormatUnit, number][] = [
      ["year", 31536000],
      ["month", 2592000],
      ["week", 604800],
      ["day", 86400],
      ["hour", 3600],
      ["minute", 60],
      ["second", 1],
    ];
    const [unit, duration] = units.find(([, duration]) => Math.abs(difference) >= duration) ?? ["second", 1];
    label = new Intl.RelativeTimeFormat(locale, { numeric: "auto" }).format(Math.round(difference / duration), unit);
  }
  else {
    const formats: Record<string, Intl.DateTimeFormatOptions> = {
      t: { timeStyle: "short" },
      T: { timeStyle: "medium" },
      d: { dateStyle: "short" },
      D: { dateStyle: "long" },
      f: { dateStyle: "long", timeStyle: "short" },
      F: { dateStyle: "full", timeStyle: "short" },
    };
    label = new Intl.DateTimeFormat(locale, {
      ...(formats[format] ?? formats.f),
      timeZone,
    }).format(date);
  }
  return {
    dateTime: date.toISOString(),
    label,
  };
}
