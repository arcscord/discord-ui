import type { SelectMenuView, SelectOptionView } from "../model/components";

export type ResolvedSelectOption = SelectOptionView & { value: string; label: string };

export function selectOptions(menu: SelectMenuView): ResolvedSelectOption[] {
  if (menu.kind === "string-select")
    return menu.options;
  const entities = menu.kind === "channel-select" && menu.channelTypes
    ? menu.entities.filter(entity => menu.channelTypes?.includes(entity.channelType))
    : menu.entities;
  return entities.map(entity => ({
    ...entity,
    value: entity.id,
    label: entity.entityType === "user"
      ? entity.displayName
      : entity.name,
  }));
}

export function defaultSelectValues(menu: SelectMenuView): string[] {
  return menu.kind === "string-select"
    ? menu.options.filter(option => option.default).map(option => option.value)
    : menu.defaultValues?.map(value => value.id) ?? [];
}

export function singleSelectMenu(menu: SelectMenuView): SelectMenuView {
  const base = {
    ...menu,
    id: `${menu.id}-single`,
    placeholder: "Choose one option",
    minValues: 1,
    maxValues: 1,
  };
  return base.kind === "string-select"
    ? {
        ...base,
        options: base.options.map(option => ({ ...option, default: false })),
      }
    : { ...base, defaultValues: [] };
}
