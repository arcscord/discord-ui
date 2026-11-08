import type { SlashCommand, SlashCommandHandler } from "@arcscord/discord-ui-core";
import type { ReactNode } from "react";
import { useEffect, useId, useRef, useState } from "react";
import { useDisplayOptions } from "../display-context";
import { SlashCommandEditor } from "./slash-command-editor";

export type ChannelComposerProps = {
  channelName: string;
  value: string;
  onValueChange: (value: string) => void;
  onSend?: ((content: string) => void) | undefined;
  commands?: readonly SlashCommand[] | undefined;
  onSlashCommand?: SlashCommandHandler | undefined;
  disabled?: boolean;
  leading?: ReactNode;
  trailing?: ReactNode;
};

export function ChannelComposer({ channelName, value, onValueChange, onSend, commands, onSlashCommand, disabled = false, leading, trailing }: ChannelComposerProps) {
  const { labels } = useDisplayOptions();
  const placeholder = labels.messagePlaceholder.replace("{channel}", channelName);
  const listId = useId();
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const restoreInputFocusRef = useRef(false);
  const argumentsRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<SlashCommand>();
  const [argumentValues, setArgumentValues] = useState<Record<string, string>>({});
  const [active, setActive] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const query = value.slice(1).toLowerCase();
  const matches = value.startsWith("/") && !selected && !dismissed && !disabled
    ? commands?.filter(command => command.name.toLowerCase().includes(query)) ?? []
    : [];
  const activeIndex = Math.min(active, Math.max(0, matches.length - 1));
  const canSend = selected
    ? Boolean(onSlashCommand)
    : Boolean(onSend);
  const valid = selected
    ? (selected.arguments ?? []).every(argument => (!argument.required || Boolean(argumentValues[argument.name]?.trim()))
      && (!argumentValues[argument.name] || !argument.choices || argument.choices.some(choice => choice.value === argumentValues[argument.name])))
    : Boolean(value.trim());
  useEffect(() => {
    if (selected) {
      const fields = argumentsRef.current;
      ((selected.arguments?.length
        ? fields?.querySelector<HTMLElement>(".dui-slash-more")
        : undefined) ?? fields?.closest("form")?.querySelector<HTMLButtonElement>("button[type=submit]") ?? fields?.querySelector("button"))?.focus();
    }
    else if (restoreInputFocusRef.current) {
      restoreInputFocusRef.current = false;
      inputRef.current?.focus();
    }
  }, [selected]);
  function selectCommand(command: SlashCommand): void {
    setSelected(command);
    setArgumentValues({});
    onValueChange("");
  }
  function cancelCommand(): void {
    restoreInputFocusRef.current = true;
    setSelected(undefined);
    setArgumentValues({});
    setDismissed(true);
    onValueChange("/");
  }
  function send(): void {
    if (disabled || !valid)
      return;
    if (selected) {
      if (!onSlashCommand)
        return;
      onSlashCommand({
        command: selected,
        arguments: Object.fromEntries(Object.entries(argumentValues).filter(([, value]) => value.trim())),
      });
      restoreInputFocusRef.current = true;
      setSelected(undefined);
      setArgumentValues({});
      onValueChange("");
      return;
    }
    onSend?.(value);
  }
  return (
    <form
      className={`dui-channel-composer${selected ? " dui-composer-command" : ""}`}
      onKeyDown={(event) => {
        if (event.defaultPrevented || !selected || disabled || event.nativeEvent.isComposing)
          return;
        if (event.key === "Backspace" && !selected.arguments?.length) {
          event.preventDefault();
          cancelCommand();
          return;
        }
        if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
          event.preventDefault();
          event.currentTarget.requestSubmit();
        }
        if (event.key === "Escape") {
          event.preventDefault();
          cancelCommand();
        }
      }}
      onSubmit={(event) => {
        event.preventDefault();
        send();
      }}
    >
      {matches.length > 0
        ? (
            <div className="dui-slash-list" id={listId} role="listbox" aria-label={labels.slashCommands}>
              {matches.map((command, index) => (
                <button
                  key={command.name}
                  id={`${listId}-${index}`}
                  type="button"
                  role="option"
                  aria-selected={index === activeIndex}
                  className="dui-slash-option"
                  onMouseMove={() => setActive(index)}
                  onFocus={() => setActive(index)}
                  onMouseDown={event => event.preventDefault()}
                  onClick={() => selectCommand(command)}
                >
                  <span className="dui-slash-summary">
                    <strong>
                      /
                      {command.name}
                    </strong>
                    <span>{command.description}</span>
                  </span>
                  {command.application
                    ? <span className="dui-slash-application">{command.application}</span>
                    : null}
                </button>
              ))}
            </div>
          )
        : null}
      {selected
        ? <div className="dui-slash-fields" ref={argumentsRef}><SlashCommandEditor command={selected} values={argumentValues} onChange={setArgumentValues} onCancel={cancelCommand} disabled={disabled} /></div>
        : null}
      {leading
        ? <div className="dui-composer-leading">{leading}</div>
        : null}
      <textarea
        ref={inputRef}
        hidden={Boolean(selected)}
        aria-controls={matches.length ? listId : undefined}
        aria-activedescendant={matches.length
          ? `${listId}-${activeIndex}`
          : undefined}
        className="dui-channel-input"
        aria-label={placeholder}
        placeholder={placeholder}
        rows={1}
        value={value}
        disabled={disabled}
        onChange={(event) => {
          onValueChange(event.target.value);
          setActive(0);
          setDismissed(false);
        }}
        onKeyDown={(event) => {
          if (event.nativeEvent.isComposing)
            return;
          if (matches.length) {
            if (event.key === "ArrowDown" || event.key === "ArrowUp") {
              event.preventDefault();
              const next = (activeIndex + (event.key === "ArrowDown"
                ? 1
                : -1) + matches.length) % matches.length;
              setActive(next);
              document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: "nearest" });
              return;
            }
            if ((event.key === "Enter" && !event.shiftKey) || event.key === "Tab") {
              event.preventDefault();
              selectCommand(matches[activeIndex]!);
              return;
            }
            if (event.key === "Escape") {
              event.preventDefault();
              setDismissed(true);
              return;
            }
          }
          if (event.key === "Enter" && !event.shiftKey && onSend) {
            event.preventDefault();
            send();
          }
        }}
      />
      {trailing
        ? <div className="dui-composer-trailing">{trailing}</div>
        : null}
      {canSend
        ? (
            <button type="submit" className="dui-channel-send" aria-label={labels.sendMessage} disabled={disabled || !valid}>
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
