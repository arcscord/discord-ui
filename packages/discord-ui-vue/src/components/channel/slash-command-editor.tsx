import type { SlashCommand } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { CSSProperties } from "vue";
import { shallowRef, useId } from "vue";
import { defineRenderer, elementRef, mountedWatch, state, styleValue } from "../../rendering";

type PropsInput = {
  command: SlashCommand;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onCancel: () => void;
  disabled: boolean;
};
export type Props = PropsInput;
export type SlashCommandEditorSlots = Record<string, never>;
export const SlashCommandEditor = defineRenderer<Props, PropsInput, SlashCommandEditorSlots>("SlashCommandEditor", [
  "command",
  "values",
  "onChange",
  "onCancel",
  "disabled",
], [], (input, display) => {
  const id = useId();
  const [addedState, setAdded] = state<string[]>([]);
  const [editingState, setEditing] = state<string | undefined>(undefined);
  const [activeState, setActive] = state<number>(0);
  const fieldsRef = shallowRef(new Map<string, HTMLInputElement>());
  const moreRef = shallowRef<HTMLButtonElement | null>(null);
  function derive(withSlots = false) {
    const { command, values, onChange, onCancel, disabled } = input(withSlots);
    const { labels } = display;
    const added = addedState.value;
    const editing = editingState.value;
    const active = activeState.value;
    const argument = command.arguments?.find(argument => argument.name === editing);
    const available = command.arguments?.filter(argument => !added.includes(argument.name)) ?? [];
    const choices = argument?.choices?.filter(choice => !values[argument.name] || choice.value === values[argument.name] || choice.name.toLowerCase().includes(values[argument.name]!.toLowerCase()) || choice.value.toLowerCase().includes(values[argument.name]!.toLowerCase()));
    const options = editing
      ? choices ?? []
      : available;
    const activeIndex = Math.min(active, Math.max(0, options.length - 1));
    function activate(name: string): void {
      setAdded(previous => previous.includes(name)
        ? previous
        : [...previous, name]);
      setEditing(name);
      setActive(0);
    }
    function pick(index: number): void {
      if (argument?.choices) {
        const choice = choices?.[index];
        if (choice) {
          onChange({ ...values, [argument.name]: choice.value });
          setEditing(undefined);
          moreRef.value?.focus();
        }
      }
      else if (available[index]) {
        activate(available[index].name);
      }
    }
    function removeArgument(name = editing, focusPrevious = false): void {
      if (!name) {
        onCancel();
        return;
      }
      const next = { ...values };
      delete next[name];
      onChange(next);
      const previousName = focusPrevious
        ? added[added.indexOf(name) - 1]
        : undefined;
      setAdded(previous => previous.filter(item => item !== name));
      setEditing(previousName);
      if (!previousName)
        moreRef.value?.focus();
    }
    return {
      command,
      values,
      onChange,
      onCancel,
      disabled,
      labels,
      added,
      editing,
      active,
      argument,
      available,
      choices,
      options,
      activeIndex,
      activate,
      pick,
      removeArgument,
    };
  }
  mountedWatch(() => {
    const { editing } = derive();
    return [editing];
  }, () => {
    const { editing } = derive();
    return (() => {
      if (editing)
        fieldsRef.value.get(editing)?.focus();
    })();
  });
  return () => {
    const { command, values, onChange, onCancel, disabled, labels, added, editing, argument, available, choices, options, activeIndex, activate, pick, removeArgument } = derive(true);
    return (
      <div
        class="dui-slash-editor"
        onKeydown={(event) => {
          if (disabled || event.isComposing || !options.length)
            return;
          if (event.target instanceof HTMLElement && event.target.closest(".dui-slash-heading"))
            return;
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            const next = (activeIndex + (event.key === "ArrowDown"
              ? 1
              : -1) + options.length) % options.length;
            setActive(next);
            document.getElementById(`${id}-${next}`)?.scrollIntoView({ block: "nearest" });
          }
          if (event.key === "Enter" || (event.key === "Tab" && editing && choices?.length)) {
            event.preventDefault();
            event.stopPropagation();
            pick(activeIndex);
          }
        }}
      >
        {options.length && !disabled
          ? (
              <div class="dui-slash-list dui-slash-arguments" role="listbox" id={id} aria-label={argument ? labels.chooseValue : labels.commandOptions}>
                <div class="dui-slash-list-title">{argument ? argument.name : labels.commandOptions}</div>
                {options.map((option, index) => (
                  <button key={option.name} id={`${id}-${index}`} type="button" role="option" aria-selected={index === activeIndex} class="dui-slash-option" onMousemove={() => setActive(index)} onFocus={() => setActive(index)} onMousedown={event => event.preventDefault()} onClick={() => pick(index)}>
                    <span>{option.name}</span>
                    {"description" in option
                      ? <span class="dui-slash-option-description">{option.description}</span>
                      : null}
                  </button>
                ))}
              </div>
            )
          : null}
        <div class="dui-slash-heading">
          <strong>{argument?.name ?? `/${command.name}`}</strong>
          <span>{argument?.description ?? command.description}</span>
          <button type="button" onClick={() => removeArgument()} disabled={disabled} aria-label={argument ? labels.removeArgument : labels.cancelCommand}>×</button>
        </div>
        <div class="dui-slash-line">
          <span class="dui-slash-app-icon" aria-hidden="true">/</span>
          <strong class="dui-slash-command-name">
            /
            {command.name}
          </strong>
          {added.map((name) => {
            const option = command.arguments?.find(argument => argument.name === name);
            if (!option)
              return null;
            const text = option.choices?.find(choice => choice.value === values[name])?.name ?? values[name] ?? "";
            return (
              <label
                class={`dui-slash-token${editing === name
                  ? " dui-slash-token-active"
                  : ""}`}
                key={name}
              >
                <span>{name}</span>
                <input
                  ref={(rawElement) => {
                    const element = elementRef<HTMLInputElement>(rawElement);
                    if (element)
                      fieldsRef.value.set(name, element);
                    else
                      fieldsRef.value.delete(name);
                  }}
                  aria-label={name}
                  aria-description={option.description}
                  role={option.choices ? "combobox" : undefined}
                  aria-expanded={option.choices
                    ? editing === name && Boolean(choices?.length)
                    : undefined}
                  aria-controls={option.choices && editing === name && choices?.length
                    ? id
                    : undefined}
                  aria-activedescendant={option.choices && editing === name && choices?.length
                    ? `${id}-${activeIndex}`
                    : undefined}
                  autocomplete="off"
                  style={styleValue({ "--dui-argument-width": `${Math.max(1, text.length)}ch` } as CSSProperties)}
                  value={text}
                  required={option.required}
                  disabled={disabled}
                  onFocus={() => {
                    setEditing(name);
                    setActive(0);
                  }}
                  onKeydown={(event) => {
                    if (!disabled && !event.isComposing && event.key === "Backspace" && !(event.currentTarget as HTMLInputElement & HTMLFormElement & HTMLDivElement).value) {
                      event.preventDefault();
                      event.stopPropagation();
                      removeArgument(name, true);
                    }
                  }}
                  onInput={(event) => {
                    onChange({ ...values, [name]: (event.target as HTMLInputElement).value });
                    setActive(0);
                  }}
                />
              </label>
            );
          })}
          <button
            ref={moreRef}
            class="dui-slash-more"
            type="button"
            disabled={disabled}
            aria-label={labels.commandOptions}
            aria-expanded={!editing && available.length > 0}
            onFocus={() => setEditing(undefined)}
            onKeydown={(event) => {
              if (disabled || event.isComposing || event.key !== "Backspace")
                return;
              const last = added.at(-1);
              event.preventDefault();
              event.stopPropagation();
              if (!last) {
                onCancel();
                return;
              }
              if (!values[last]) {
                removeArgument(last, true);
                return;
              }
              const field = fieldsRef.value.get(last);
              field?.focus();
              field?.setSelectionRange(field.value.length, field.value.length);
            }}
            onClick={() => {
              if (available.length)
                activate(available[activeIndex]?.name ?? available[0]!.name);
              else
                moreRef.value?.closest("form")?.requestSubmit();
            }}
          >
            {available.length
              ? `+${available.length} ${labels.commandOptions.toLowerCase()}`
              : labels.commandReady}
          </button>
        </div>
      </div>
    );
  };
});
export type SlashCommandEditorEmits = { change: Parameters<NonNullable<Props["onChange"]>>; cancel: Parameters<NonNullable<Props["onCancel"]>> };
