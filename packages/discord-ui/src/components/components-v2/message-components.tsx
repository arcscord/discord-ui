import type { ReactNode } from "react";
import type { LinkButtonView, MessageComponent } from "../../model/components";
import { Emoji } from "../content/emoji";
import { MediaGallery } from "../media/media-gallery";
import { ActionRow, Container, LinkButton, Section, Separator, TextDisplay, Thumbnail } from "./primitives";

function button(view: LinkButtonView): ReactNode {
  return (
    <LinkButton
      key={view.id}
      label={view.label}
      url={view.url}
      disabled={view.disabled}
      emoji={view.emoji
        ? <Emoji name={view.emoji.name} image={view.emoji.image} />
        : undefined}
    />
  );
}

export function MessageComponents({ components, referenceTime }: { components: readonly MessageComponent[]; referenceTime?: string | undefined }) {
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
      case "action-row": return <ActionRow key={component.id}>{component.buttons.map(button)}</ActionRow>;
      case "container": return <Container key={component.id} accentColor={component.accentColor} spoiler={component.spoiler}>{component.components.map(render)}</Container>;
      default: return <span role="note">Unsupported component</span>;
    }
  }
  return <div className="dui-components-v2">{components.map(render)}</div>;
}
