import type { APIActionRowComponent, APIAttachment, APIButtonComponent, APIComponentInContainer, APIComponentInMessageActionRow, APIMessageTopLevelComponent } from "discord-api-types/v10";
import type { ActionRowView, ButtonView, ContainerChild, MessageButtonView, MessageComponent, SelectDefaultValue, SelectMenuView } from "../model/components";
import type { ChannelEntityView, RoleView, UserView } from "../model/entities";
import { ButtonStyle, ComponentType, SeparatorSpacingSize } from "discord-api-types/v10";
import { emojiView, hexColor, isDisplayChannelType } from "./entities";
import { fileView, galleryMediaView, mediaView, resolveMedia } from "./media";

export type DiscordMessageConversionOptions = {
  /** Available choices for each entity select, keyed by its Discord custom_id. */
  selectEntities?: Readonly<Record<string, {
    users?: readonly UserView[];
    roles?: readonly RoleView[];
    channels?: readonly ChannelEntityView[];
  } | undefined>>;
};

export type DiscordComponentConversionOptions = DiscordMessageConversionOptions & {
  /** Attachments supplied by the containing message for attachment:// references. */
  attachments?: readonly APIAttachment[];
};

function componentId(component: { id?: number }, path: string): string {
  return component.id
    ? String(component.id)
    : `component:${path}`;
}

const buttonStyles = {
  [ButtonStyle.Primary]: "primary",
  [ButtonStyle.Secondary]: "secondary",
  [ButtonStyle.Success]: "success",
  [ButtonStyle.Danger]: "danger",
} satisfies Record<number, ButtonView["style"]>;

function convertButton(button: APIButtonComponent, path: string): MessageButtonView | undefined {
  const disabled = button.disabled === undefined
    ? {}
    : { disabled: button.disabled };
  if (button.style === ButtonStyle.Premium) {
    return {
      id: componentId(button, path),
      kind: "premium-button",
      skuId: button.sku_id,
      label: "Premium",
      ...disabled,
    };
  }

  const emoji = button.emoji && emojiView(button.emoji);
  const presentation = {
    label: button.label ?? "",
    ...(emoji
      ? { emoji }
      : {}),
    ...disabled,
  };
  if (button.style === ButtonStyle.Link) {
    return {
      id: componentId(button, path),
      kind: "link-button",
      url: button.url,
      ...presentation,
    };
  }

  const style = buttonStyles[button.style];
  return style
    ? {
        id: button.custom_id,
        kind: "button",
        style,
        ...presentation,
      }
    : undefined;
}

function convertSelect(select: Exclude<APIComponentInMessageActionRow, APIButtonComponent>, options: DiscordMessageConversionOptions): SelectMenuView | undefined {
  const base = {
    id: select.custom_id,
    ...(select.placeholder !== undefined
      ? { placeholder: select.placeholder }
      : {}),
    ...(select.min_values !== undefined
      ? { minValues: select.min_values }
      : {}),
    ...(select.max_values !== undefined
      ? { maxValues: select.max_values }
      : {}),
    ...(select.disabled !== undefined
      ? { disabled: select.disabled }
      : {}),
  };
  if (select.type === ComponentType.StringSelect) {
    return {
      ...base,
      kind: "string-select",
      options: select.options.map(({ label, value, description, emoji, default: selected }) => {
        const displayEmoji = emoji && emojiView(emoji);
        return {
          label,
          value,
          ...(description !== undefined
            ? { description }
            : {}),
          ...(selected !== undefined
            ? { default: selected }
            : {}),
          ...(displayEmoji
            ? { emoji: displayEmoji }
            : {}),
        };
      }),
    };
  }

  const choices = options.selectEntities && Object.hasOwn(options.selectEntities, select.custom_id)
    ? options.selectEntities[select.custom_id]
    : undefined;
  switch (select.type) {
    case ComponentType.UserSelect:
      return {
        ...base,
        kind: "user-select",
        entities: (choices?.users ?? []).map(user => ({ ...user, entityType: "user" })),
        ...defaultsFor(select.default_values),
      };
    case ComponentType.RoleSelect:
      return {
        ...base,
        kind: "role-select",
        entities: (choices?.roles ?? []).map(role => ({ ...role, entityType: "role" })),
        ...defaultsFor(select.default_values),
      };
    case ComponentType.MentionableSelect:
      return {
        ...base,
        kind: "mentionable-select",
        entities: [
          ...(choices?.users ?? []).map(user => ({ ...user, entityType: "user" as const })),
          ...(choices?.roles ?? []).map(role => ({ ...role, entityType: "role" as const })),
        ],
        ...defaultsFor(select.default_values),
      };
    case ComponentType.ChannelSelect:
      return {
        ...base,
        kind: "channel-select",
        entities: (choices?.channels ?? []).map(channel => ({ ...channel, entityType: "channel" })),
        ...(select.channel_types !== undefined
          ? {
              channelTypes: select.channel_types.filter(isDisplayChannelType),
            }
          : {}),
        ...defaultsFor(select.default_values),
      };
    default:
      return undefined;
  }
}

function defaultsFor<Type extends "user" | "role" | "channel">(values: readonly SelectDefaultValue<Type>[] | undefined): { defaultValues?: SelectDefaultValue<Type>[] } {
  return values === undefined
    ? {}
    : {
        defaultValues: values.map(({ id, type }) => ({ id, type })),
      };
}

export function convertActionRow(row: APIActionRowComponent<APIComponentInMessageActionRow>, path: string, options: DiscordMessageConversionOptions): ActionRowView | undefined {
  const id = componentId(row, path);
  const buttons: MessageButtonView[] = [];
  for (const [index, child] of row.components.entries()) {
    if (child.type === ComponentType.Button) {
      const button = convertButton(child, `${path}.${index}`);
      if (button)
        buttons.push(button);
    }
    else {
      const select = convertSelect(child, options);
      if (select)
        return { id, kind: "action-row", select };
    }
  }
  return buttons.length
    ? { id, kind: "action-row", buttons }
    : undefined;
}

function convertChild(component: APIComponentInContainer, path: string, options: DiscordComponentConversionOptions): ContainerChild | undefined {
  const id = componentId(component, path);
  const attachments = options.attachments ?? [];
  switch (component.type) {
    case ComponentType.ActionRow:
      return convertActionRow(component, path, options);
    case ComponentType.TextDisplay:
      return { id, kind: "text-display", content: component.content };
    case ComponentType.Separator:
      return {
        id,
        kind: "separator",
        divider: component.divider ?? true,
        spacing: component.spacing === SeparatorSpacingSize.Large
          ? "large"
          : "small",
      };
    case ComponentType.Section: {
      const source = component.accessory;
      const accessoryId = componentId(source, `${path}.accessory`);
      const thumbnail = source.type === ComponentType.Thumbnail
        ? mediaView(accessoryId, source.media, attachments, source.description, source.spoiler)
        : undefined;
      const accessory = thumbnail
        ? { id: accessoryId, kind: "thumbnail" as const, media: thumbnail }
        : source.type === ComponentType.Button
          ? convertButton(source, `${path}.accessory`)
          : undefined;
      const components = component.components.flatMap((text, index) => text.type === ComponentType.TextDisplay
        ? [
            {
              id: componentId(text, `${path}.${index}`),
              kind: "text-display" as const,
              content: text.content,
            },
          ]
        : []);
      return accessory && components.length
        ? {
            id,
            kind: "section",
            components,
            accessory,
          }
        : undefined;
    }
    case ComponentType.MediaGallery: {
      const items = component.items
        .map((item, index) => galleryMediaView(`${id}:item:${index}`, item.media, attachments, item.description, item.spoiler))
        .filter(item => item !== undefined);
      return items.length
        ? { id, kind: "media-gallery", items }
        : undefined;
    }
    case ComponentType.File: {
      const { url, attachment, filename } = resolveMedia(component.file, attachments);
      return url
        ? fileView(id, url, component.name ?? attachment?.filename ?? filename ?? "File", component.size ?? attachment?.size, component.spoiler || attachment?.filename.startsWith("SPOILER_") || filename?.startsWith("SPOILER_"))
        : undefined;
    }
    default:
      return undefined;
  }
}

/** Convert a message's component array in order, omitting unsupported nodes. */
export function fromDiscordMessageComponents(components: readonly APIMessageTopLevelComponent[], options: DiscordComponentConversionOptions = {}): MessageComponent[] {
  return components.map((component, index): MessageComponent | undefined => {
    const path = String(index);
    if (component.type !== ComponentType.Container)
      return convertChild(component, path, options);

    return {
      id: componentId(component, path),
      kind: "container",
      components: component.components.map((child, childIndex) => convertChild(child, `${path}.${childIndex}`, options)).filter(child => child !== undefined),
      ...(component.spoiler !== undefined
        ? { spoiler: component.spoiler }
        : {}),
      ...(component.accent_color != null
        ? {
            accentColor: hexColor(component.accent_color),
          }
        : {}),
    };
  }).filter(component => component !== undefined);
}
