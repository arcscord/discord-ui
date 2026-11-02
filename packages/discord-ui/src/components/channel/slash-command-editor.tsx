import type { CSSProperties } from "react";
import type { SlashCommand } from "../../model/slash-command";
import { useEffect, useId, useRef, useState } from "react";
import { useDisplayOptions } from "../display-context";

type Props = {
  command: SlashCommand;
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  onCancel: () => void;
  disabled: boolean;
};

export function SlashCommandEditor({ command, values, onChange, onCancel, disabled }: Props) {
  const { labels } = useDisplayOptions();
  const id = useId();
  const [added, setAdded] = useState<string[]>([]);
  const [editing, setEditing] = useState<string>();
  const [active, setActive] = useState(0);
  const fieldsRef = useRef(new Map<string, HTMLInputElement>());
  const moreRef = useRef<HTMLButtonElement>(null);
  const argument = command.arguments?.find(argument => argument.name === editing);
  const available = command.arguments?.filter(argument => !added.includes(argument.name)) ?? [];
  const choices = argument?.choices?.filter(choice => !values[argument.name] || choice.value === values[argument.name] || choice.name.toLowerCase().includes(values[argument.name]!.toLowerCase()) || choice.value.toLowerCase().includes(values[argument.name]!.toLowerCase()));
  const options = editing
    ? choices ?? []
    : available;
  const activeIndex = Math.min(active, Math.max(0, options.length - 1));
  useEffect(() => {
    if (editing)
      fieldsRef.current.get(editing)?.focus();
  }, [editing]);
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
        moreRef.current?.focus();
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
      moreRef.current?.focus();
  }
  return (
    <div
      className="dui-slash-editor"
      onKeyDown={(event) => {
        if (disabled || event.nativeEvent.isComposing || !options.length)
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
            <div className="dui-slash-list dui-slash-arguments" role="listbox" id={id} aria-label={argument ? labels.chooseValue : labels.commandOptions}>
              <div className="dui-slash-list-title">{argument ? argument.name : labels.commandOptions}</div>
              {options.map((option, index) => (
                <button key={option.name} id={`${id}-${index}`} type="button" role="option" aria-selected={index === activeIndex} className="dui-slash-option" onMouseMove={() => setActive(index)} onFocus={() => setActive(index)} onMouseDown={event => event.preventDefault()} onClick={() => pick(index)}>
                  <span>{option.name}</span>
                  {"description" in option
                    ? <span className="dui-slash-option-description">{option.description}</span>
                    : null}
                </button>
              ))}
            </div>
          )
        : null}
      <div className="dui-slash-heading">
        <strong>{argument?.name ?? `/${command.name}`}</strong>
        <span>{argument?.description ?? command.description}</span>
        <button type="button" onClick={() => removeArgument()} disabled={disabled} aria-label={argument ? labels.removeArgument : labels.cancelCommand}>×</button>
      </div>
      <div className="dui-slash-line">
        <span className="dui-slash-app-icon" aria-hidden="true">/</span>
        <strong className="dui-slash-command-name">
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
              className={`dui-slash-token${editing === name
                ? " dui-slash-token-active"
                : ""}`}
              key={name}
            >
              <span>{name}</span>
              <input
                ref={(element) => {
                  if (element)
                    fieldsRef.current.set(name, element);
                  else fieldsRef.current.delete(name);
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
                autoComplete="off"
                style={{ "--dui-argument-width": `${Math.max(1, text.length)}ch` } as CSSProperties}
                value={text}
                required={option.required}
                disabled={disabled}
                onFocus={() => {
                  setEditing(name);
                  setActive(0);
                }}
                onKeyDown={(event) => {
                  if (!disabled && !event.nativeEvent.isComposing && event.key === "Backspace" && !event.currentTarget.value) {
                    event.preventDefault();
                    event.stopPropagation();
                    removeArgument(name, true);
                  }
                }}
                onChange={(event) => {
                  onChange({ ...values, [name]: event.target.value });
                  setActive(0);
                }}
              />
            </label>
          );
        })}
        <button
          ref={moreRef}
          className="dui-slash-more"
          type="button"
          disabled={disabled}
          aria-label={labels.commandOptions}
          aria-expanded={!editing && available.length > 0}
          onFocus={() => setEditing(undefined)}
          onKeyDown={(event) => {
            if (disabled || event.nativeEvent.isComposing || event.key !== "Backspace")
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
            const field = fieldsRef.current.get(last);
            field?.focus();
            field?.setSelectionRange(field.value.length, field.value.length);
          }}
          onClick={() => {
            if (available.length)
              activate(available[activeIndex]?.name ?? available[0]!.name);
            else moreRef.current?.closest("form")?.requestSubmit();
          }}
        >
          {available.length
            ? `+${available.length} ${labels.commandOptions.toLowerCase()}`
            : labels.commandReady}
        </button>
      </div>
    </div>
  );
}
