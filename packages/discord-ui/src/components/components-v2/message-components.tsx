import type { ReactNode } from "react";
import type { ComponentHandlers, ComponentInteractionContext, MessageButtonView, MessageComponent, SelectValues } from "../../model/components";
import { Emoji } from "../content/emoji";
import { MediaGallery } from "../media/media-gallery";
import { ActionRow, Button, Container, File, LinkButton, Section, Separator, TextDisplay, Thumbnail } from "./primitives";
import { SelectMenu } from "./select-menu";

export type MessageComponentsProps = ComponentHandlers & {
  components: readonly MessageComponent[];
  referenceTime?: string | undefined;
  messageId?: string | undefined;
  selectValues?: SelectValues | undefined;
};

export function MessageComponents({ components, referenceTime, messageId, selectValues, onButtonClick, onSelectChange, onPremiumClick }: MessageComponentsProps) {
  function context(componentId: string): ComponentInteractionContext {
    return messageId === undefined
      ? { componentId }
      : { componentId, messageId };
  }
  function button(view: MessageButtonView): ReactNode {
    if (view.kind === "premium-button") {
      return (
        <Button
          key={view.id}
          label={`◆ ${view.label}`}
          ariaLabel={view.ariaLabel}
          style="premium"
          disabled={view.disabled}
          onClick={onPremiumClick
            ? () => onPremiumClick(view.skuId, context(view.id))
            : undefined}
        />
      );
    }
    const emoji = view.emoji
      ? <Emoji name={view.emoji.name} image={view.emoji.image} />
      : undefined;
    const ariaLabel = view.ariaLabel?.trim() || (!view.label.trim()
      ? view.emoji?.name
      : undefined);
    return view.kind === "link-button"
      ? <LinkButton key={view.id} label={view.label} ariaLabel={ariaLabel} url={view.url} disabled={view.disabled} emoji={emoji} />
      : (
          <Button
            key={view.id}
            label={view.label}
            ariaLabel={ariaLabel}
            style={view.style}
            disabled={view.disabled}
            emoji={emoji}
            onClick={onButtonClick
              ? () => onButtonClick(view.id, context(view.id))
              : undefined}
          />
        );
  }
  function render(component: MessageComponent): ReactNode {
    switch (component.kind) {
      case "text-display": return <TextDisplay key={component.id} content={component.content} referenceTime={referenceTime} />;
      case "section": return (
        <Section
          key={component.id}
          accessory={component.accessory.kind === "thumbnail"
            ? <Thumbnail media={component.accessory.media} />
            : button(component.accessory)}
        >
          {component.components.map(text => <TextDisplay key={text.id} content={text.content} referenceTime={referenceTime} />)}
        </Section>
      );
      case "media-gallery": return <MediaGallery key={component.id} items={component.items} />;
      case "separator": return <Separator key={component.id} divider={component.divider} spacing={component.spacing} />;
      case "action-row": return (
        <ActionRow key={component.id}>
          {component.select
            ? (
                <SelectMenu
                  menu={component.select}
                  values={selectValues && Object.hasOwn(selectValues, component.select.id)
                    ? selectValues[component.select.id]
                    : undefined}
                  onChange={onSelectChange
                    ? values => onSelectChange(component.select.id, values, context(component.select.id))
                    : undefined}
                />
              )
            : component.buttons.map(button)}
        </ActionRow>
      );
      case "file": return <File key={component.id} file={component} />;
      case "container": return <Container key={component.id} accentColor={component.accentColor} spoiler={component.spoiler}>{component.components.map(render)}</Container>;
      default: return <span role="note">Unsupported component</span>;
    }
  }
  return <div className="dui-components-v2">{components.map(render)}</div>;
}
