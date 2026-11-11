import type { SlashCommand, SlashCommandHandler } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { VNodeChild } from "vue";
import { shallowRef, useId } from "vue";
import { defineRenderer, mountedWatch, state } from "../../rendering";
import { SlashCommandEditor } from "./slash-command-editor";

type ChannelComposerPropsInput = {
  "channelName": string;
  "modelValue": string;
  "onUpdate:modelValue"?: (value: string) => void;
  "onSend"?: ((content: string) => void) | undefined;
  "commands"?: readonly SlashCommand[] | undefined;
  "onSlashCommand"?: SlashCommandHandler | undefined;
  "disabled"?: boolean;
  "leading"?: VNodeChild;
  "trailing"?: VNodeChild;
};
export type ChannelComposerProps = Omit<ChannelComposerPropsInput, "leading" | "trailing">;
export type ChannelComposerSlots = { leading?: () => VNodeChild; trailing?: () => VNodeChild };
export const ChannelComposer = defineRenderer<ChannelComposerProps, ChannelComposerPropsInput, ChannelComposerSlots>("ChannelComposer", [
  "channelName",
  "modelValue",
  "onUpdate:modelValue",
  "onSend",
  "commands",
  "onSlashCommand",
  "disabled",
], ["leading", "trailing"], (input, display) => {
  const listId = useId();
  const inputRef = shallowRef<HTMLTextAreaElement | null>(null);
  const restoreInputFocusRef = shallowRef(false);
  const argumentsRef = shallowRef<HTMLDivElement | null>(null);
  const [selectedState, setSelected] = state<SlashCommand | undefined>(undefined);
  const [argumentValuesState, setArgumentValues] = state<Record<string, string>>({});
  const [activeState, setActive] = state<number>(0);
  const [dismissedState, setDismissed] = state<boolean>(false);
  function derive(withSlots = false) {
    const { channelName, "modelValue": value, "onUpdate:modelValue": onValueChange = () => {}, onSend, commands, onSlashCommand, disabled = false, leading, trailing } = input(withSlots);
    const { labels } = display;
    const placeholder = labels.messagePlaceholder.replace("{channel}", channelName);
    const selected = selectedState.value;
    const argumentValues = argumentValuesState.value;
    const active = activeState.value;
    const dismissed = dismissedState.value;
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
    function selectCommand(command: SlashCommand): void {
      setSelected(command);
      setArgumentValues({});
      onValueChange("");
    }
    function cancelCommand(): void {
      restoreInputFocusRef.value = true;
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
        restoreInputFocusRef.value = true;
        setSelected(undefined);
        setArgumentValues({});
        onValueChange("");
        return;
      }
      onSend?.(value);
    }
    return {
      channelName,
      value,
      onValueChange,
      onSend,
      commands,
      onSlashCommand,
      disabled,
      leading,
      trailing,
      labels,
      placeholder,
      selected,
      argumentValues,
      active,
      dismissed,
      query,
      matches,
      activeIndex,
      canSend,
      valid,
      selectCommand,
      cancelCommand,
      send,
    };
  }
  mountedWatch(() => {
    const { selected } = derive();
    return [selected];
  }, () => {
    const { selected } = derive();
    return (() => {
      if (selected) {
        const fields = argumentsRef.value;
        ((selected.arguments?.length
          ? fields?.querySelector<HTMLElement>(".dui-slash-more")
          : undefined) ?? fields?.closest("form")?.querySelector<HTMLButtonElement>("button[type=submit]") ?? fields?.querySelector("button"))?.focus();
      }
      else if (restoreInputFocusRef.value) {
        restoreInputFocusRef.value = false;
        inputRef.value?.focus();
      }
    })();
  });
  return () => {
    const { value, onValueChange, onSend, disabled, leading, trailing, labels, placeholder, selected, argumentValues, matches, activeIndex, canSend, valid, selectCommand, cancelCommand, send } = derive(true);
    return (
      <form
        class={`dui-channel-composer${selected ? " dui-composer-command" : ""}`}
        onKeydown={(event) => {
          if (event.defaultPrevented || !selected || disabled || event.isComposing)
            return;
          if (event.key === "Backspace" && !selected.arguments?.length) {
            event.preventDefault();
            cancelCommand();
            return;
          }
          if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
            event.preventDefault();
            (event.currentTarget as HTMLInputElement & HTMLFormElement & HTMLDivElement).requestSubmit();
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
              <div class="dui-slash-list" id={listId} role="listbox" aria-label={labels.slashCommands}>
                {matches.map((command, index) => (
                  <button key={command.name} id={`${listId}-${index}`} type="button" role="option" aria-selected={index === activeIndex} class="dui-slash-option" onMousemove={() => setActive(index)} onFocus={() => setActive(index)} onMousedown={event => event.preventDefault()} onClick={() => selectCommand(command)}>
                    <span class="dui-slash-summary">
                      <strong>
                        /
                        {command.name}
                      </strong>
                      <span>{command.description}</span>
                    </span>
                    {command.application
                      ? <span class="dui-slash-application">{command.application}</span>
                      : null}
                  </button>
                ))}
              </div>
            )
          : null}
        {selected
          ? <div class="dui-slash-fields" ref={argumentsRef}><SlashCommandEditor command={selected} values={argumentValues} onChange={setArgumentValues} onCancel={cancelCommand} disabled={disabled} /></div>
          : null}
        {leading
          ? <div class="dui-composer-leading">{leading}</div>
          : null}
        <textarea
          ref={inputRef}
          hidden={Boolean(selected)}
          aria-controls={matches.length ? listId : undefined}
          aria-activedescendant={matches.length
            ? `${listId}-${activeIndex}`
            : undefined}
          class="dui-channel-input"
          aria-label={placeholder}
          placeholder={placeholder}
          rows={1}
          value={value}
          disabled={disabled}
          onInput={(event) => {
            onValueChange((event.target as HTMLInputElement).value);
            setActive(0);
            setDismissed(false);
          }}
          onKeydown={(event) => {
            if (event.isComposing)
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
          ? <div class="dui-composer-trailing">{trailing}</div>
          : null}
        {canSend
          ? (
              <button type="submit" class="dui-channel-send" aria-label={labels.sendMessage} disabled={disabled || !valid}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="m3 3 19 9-19 9 4-9-4-9Z" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
                  <path d="M7 12h14" stroke="currentColor" stroke-width="1.8" />
                </svg>
              </button>
            )
          : null}
      </form>
    );
  };
});
export type ChannelComposerEmits = { "update:modelValue": Parameters<NonNullable<ChannelComposerProps["onUpdate:modelValue"]>>; "send": Parameters<NonNullable<ChannelComposerProps["onSend"]>>; "slash-command": Parameters<NonNullable<ChannelComposerProps["onSlashCommand"]>> };
