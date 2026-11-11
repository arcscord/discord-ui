import type { ComponentHandlers, ComponentInteractionContext, MessageButtonView, MessageComponent, SelectValues } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { VNodeChild } from "vue";
import { defineRenderer } from "../../rendering";
import { Emoji } from "../content/emoji";
import { MediaGallery } from "../media/media-gallery";
import { ActionRow, Button, Container, File, LinkButton, Section, Separator, TextDisplay, Thumbnail } from "./primitives";
import { SelectMenu } from "./select-menu";

type MessageComponentsPropsInput = ComponentHandlers & {
  components: readonly MessageComponent[];
  referenceTime?: string | undefined;
  messageId?: string | undefined;
  selectValues?: SelectValues | undefined;
};
export type MessageComponentsProps = MessageComponentsPropsInput;
export type MessageComponentsSlots = Record<string, never>;
export const MessageComponents = defineRenderer<MessageComponentsProps, MessageComponentsPropsInput, MessageComponentsSlots>("MessageComponents", [
  "onButtonClick",
  "onSelectChange",
  "onPremiumClick",
  "components",
  "referenceTime",
  "messageId",
  "selectValues",
], [], (input, _display) => {
  return () => {
    const { components, referenceTime, messageId, selectValues, onButtonClick, onSelectChange, onPremiumClick } = input(true);
    function context(componentId: string): ComponentInteractionContext {
      return messageId === undefined
        ? { componentId }
        : { componentId, messageId };
    }
    function button(view: MessageButtonView): VNodeChild {
      if (view.kind === "premium-button") {
        return (
          <Button
            key={view.id}
            label={`◆ ${view.label}`}
            ariaLabel={view.ariaLabel}
            variant="premium"
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
        ? (
            <LinkButton
              key={view.id}
              label={view.label}
              ariaLabel={ariaLabel}
              url={view.url}
              disabled={view.disabled}
              v-slots={{
                emoji: () => emoji,
              }}
            />
          )
        : (
            <Button
              key={view.id}
              label={view.label}
              ariaLabel={ariaLabel}
              variant={view.style}
              disabled={view.disabled}
              onClick={onButtonClick
                ? () => onButtonClick(view.id, context(view.id))
                : undefined}
              v-slots={{
                emoji: () => emoji,
              }}
            />
          );
    }
    function render(component: MessageComponent): VNodeChild {
      switch (component.kind) {
        case "text-display": return <TextDisplay key={component.id} content={component.content} referenceTime={referenceTime} />;
        case "section": return (
          <Section
            key={component.id}
            v-slots={{
              accessory: () => component.accessory.kind === "thumbnail"
                ? <Thumbnail media={component.accessory.media} />
                : button(component.accessory),
            }}
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
                    onUpdate:values={onSelectChange
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
    return <div class="dui-components-v2">{components.map(render)}</div>;
  };
});
export type MessageComponentsEmits = { "button-click": Parameters<NonNullable<MessageComponentsProps["onButtonClick"]>>; "select-change": Parameters<NonNullable<MessageComponentsProps["onSelectChange"]>>; "premium-click": Parameters<NonNullable<MessageComponentsProps["onPremiumClick"]>> };
