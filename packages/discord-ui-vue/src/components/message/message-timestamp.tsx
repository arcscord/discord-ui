// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { parseTimestamp } from "@arcscord/discord-ui-core";
import { defineRenderer } from "../../rendering";

type MessageTimestampPropsInput = {
  timestamp: string;
};
export type MessageTimestampProps = MessageTimestampPropsInput;
export type MessageTimestampSlots = Record<string, never>;
export const MessageTimestamp = defineRenderer<MessageTimestampProps, MessageTimestampPropsInput, MessageTimestampSlots>("MessageTimestamp", ["timestamp"], [], (input, display) => {
  return () => {
    const { timestamp } = input(true);
    const { locale, timeZone, labels } = display;
    const date = parseTimestamp(timestamp);
    if (!date)
      return <span class="dui-timestamp">{labels.invalidTimestamp}</span>;
    const label = new Intl.DateTimeFormat(locale, { dateStyle: "medium", timeStyle: "short", timeZone }).format(date);
    return <time class="dui-timestamp" datetime={date.toISOString()} title={label}>{label}</time>;
  };
});
export type MessageTimestampEmits = Record<string, never>;
