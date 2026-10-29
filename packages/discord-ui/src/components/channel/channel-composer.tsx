import type { ReactNode } from "react";
import { useDisplayOptions } from "../display-context";

export type ChannelComposerProps = {
  channelName: string;
  value: string;
  onValueChange: (value: string) => void;
  onSend?: ((content: string) => void) | undefined;
  disabled?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function ChannelComposer({ channelName, value, onValueChange, onSend, disabled = false, leading, trailing }: ChannelComposerProps) {
  const { labels } = useDisplayOptions();
  const placeholder = labels.messagePlaceholder.replace("{channel}", channelName);
  function send(): void {
    if (!disabled && value.trim())
      onSend?.(value);
  }
  return (
    <form
      className="dui-channel-composer"
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      {leading
        ? <div className="dui-composer-leading">{leading}</div>
        : null}
      <textarea
        className="dui-channel-input"
        aria-label={placeholder}
        placeholder={placeholder}
        rows={1}
        value={value}
        disabled={disabled}
        onChange={event => onValueChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing && onSend) {
            event.preventDefault();
            send();
          }
        }}
      />
      {trailing
        ? <div className="dui-composer-trailing">{trailing}</div>
        : null}
      {onSend
        ? (
            <button type="submit" className="dui-channel-send" aria-label={labels.sendMessage} disabled={disabled || !value.trim()}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path d="m3 3 19 9-19 9 4-9-4-9Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M7 12h14" stroke="currentColor" strokeWidth="1.8" />
              </svg>
            </button>
          )
        : null}
    </form>
  );
}
