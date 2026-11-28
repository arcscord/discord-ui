import type { ComparisonConfig, Framework, LocalState } from "../../../../fixtures/comparison/scenarios";
import { frameworks, parseConfig } from "../../../../fixtures/comparison/scenarios";

export const protocol = "discord-ui-comparison-v1";
export const eventNames = [
  "button-click",
  "select-change",
  "reaction-toggle",
  "send",
  "thread-open",
  "thread-close",
  "thread-send",
  "premium-click",
  "slash-command",
  "host-update",
  "ephemeral-dismiss",
  "user-click",
  "user-context-menu",
  "mention-click",
  "mention-context-menu",
  "message-context-menu",
  "channel-click",
] as const;
export type NativeEvent = { name: typeof eventNames[number]; args: unknown[] };
export type Snapshot = Pick<LocalState, "waves" | "reacted" | "selectValues" | "activeThreadId" | "channelList"> & { messageCount: number; replyCount: number };
export function snapshot(state: LocalState): Snapshot {
  return {
    waves: state.waves,
    reacted: state.reacted,
    selectValues: Object.fromEntries(Object.entries(state.selectValues).filter(([, values]) => values !== undefined)),
    activeThreadId: state.activeThreadId,
    messageCount: state.channel.messages.length,
    replyCount: state.channel.threads?.[0]?.messages.length ?? 0,
    ...(state.channelList
      ? {
          channelList: { ...state.channelList },
        }
      : {}),
  };
}
type Envelope = { protocol: typeof protocol; framework: Framework; revision: number };
export type ConfigureMessage = Envelope & { type: "configure"; config: ComparisonConfig; reset: boolean };
export type FrameMessage = Envelope & (
  | { type: "ready" }
  | { type: "applied"; state: Snapshot }
  | { type: "event"; event: NativeEvent; state: Snapshot }
  | { type: "error"; error: string }
);

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object"
    && value !== null
    && !Array.isArray(value);
}
function envelope(value: unknown): value is Record<string, unknown> & Envelope {
  return record(value)
    && value.protocol === protocol
    && frameworks.includes(value.framework as Framework)
    && Number.isSafeInteger(value.revision)
    && (value.revision as number) >= 0;
}
export function isConfig(value: unknown): value is ComparisonConfig {
  if (!record(value) || typeof value.allowRemoteMedia !== "boolean" || (value.customTheme !== undefined && typeof value.customTheme !== "boolean"))
    return false;
  const parsed = parseConfig(new URLSearchParams({
    scenario: String(value.scenario),
    theme: String(value.theme),
    locale: String(value.locale),
  }));
  return !parsed.fallback
    && value.scenario === parsed.config.scenario
    && value.theme === parsed.config.theme
    && value.locale === parsed.config.locale;
}
function isSnapshot(value: unknown): value is Snapshot {
  return record(value)
    && Number.isSafeInteger(value.waves)
    && typeof value.reacted === "boolean"
    && (value.activeThreadId === null || typeof value.activeThreadId === "string")
    && Number.isSafeInteger(value.messageCount)
    && Number.isSafeInteger(value.replyCount)
    && (value.channelList === undefined || (record(value.channelList)
      && typeof value.channelList.activeChannelId === "string"
      && typeof value.channelList.interactive === "boolean"
      && typeof value.channelList.customIcons === "boolean"))
    && record(value.selectValues)
    && Object.values(value.selectValues).every(values => Array.isArray(values)
      && values.every(entry => typeof entry === "string"));
}
export function isConfigureMessage(value: unknown): value is ConfigureMessage {
  return envelope(value)
    && value.type === "configure"
    && isConfig(value.config)
    && typeof value.reset === "boolean";
}
export function isFrameMessage(value: unknown): value is FrameMessage {
  if (!envelope(value))
    return false;
  if (value.type === "ready")
    return true;
  if (value.type === "error")
    return typeof value.error === "string";
  if (value.type === "applied")
    return isSnapshot(value.state);
  return value.type === "event"
    && isSnapshot(value.state)
    && record(value.event)
    && eventNames.includes(value.event.name as NativeEvent["name"])
    && Array.isArray(value.event.args);
}

export const frameworkNames = { react: "React", vue: "Vue", svelte: "Svelte" };

/** Only serializable event observations cross the fixture protocol. */
export function utilityEvent(name: NativeEvent["name"], target: unknown, event: Pick<MouseEvent, "defaultPrevented" | "preventDefault" | "button">, prevent: boolean): NativeEvent {
  const before = event.defaultPrevented;
  if (prevent)
    event.preventDefault();
  return {
    name,
    args: [
      target,
      { defaultPreventedBefore: before, defaultPreventedAfter: event.defaultPrevented, button: event.button },
    ],
  };
}
