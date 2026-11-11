import type { FileView, MediaView } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import type { CSSProperties, VNodeChild } from "vue";
import { linkUrl } from "@arcscord/discord-ui-core";
import { defineRenderer, styleValue } from "../../rendering";
import { Markdown } from "../content/markdown";
import { Spoiler } from "../content/spoiler";
import { Media } from "../media/media";

type ContainerPropsInput = {
  children: VNodeChild;
  accentColor?: string | undefined;
  spoiler?: boolean | undefined;
};
export type ContainerProps = Omit<ContainerPropsInput, "children">;
export type ContainerSlots = { default?: () => VNodeChild };
export const Container = defineRenderer<ContainerProps, ContainerPropsInput, ContainerSlots>("Container", ["accentColor", "spoiler"], ["children"], (input, _display) => {
  return () => {
    const { children, accentColor, spoiler = false } = input(true);
    const color = /^#[a-f\d]{6}$/iu.test(accentColor ?? "")
      ? accentColor
      : undefined;
    const content = (
      <div
        class={`dui-container${color ? " dui-container-accented" : ""}`}
        style={styleValue(color
          ? { "--discord-ui-container-accent": color } as CSSProperties
          : undefined)}
      >
        {children}
      </div>
    );
    return spoiler
      ? <Spoiler inline={false}>{content}</Spoiler>
      : content;
  };
});
export type ContainerEmits = Record<string, never>;
type SectionPropsInput = {
  children: VNodeChild;
  accessory: VNodeChild;
};
export type SectionProps = Omit<SectionPropsInput, "children" | "accessory">;
export type SectionSlots = { default?: () => VNodeChild; accessory?: () => VNodeChild };
export const Section = defineRenderer<SectionProps, SectionPropsInput, SectionSlots>("Section", [], ["children", "accessory"], (input, _display) => {
  return () => {
    const { children, accessory } = input(true);

    return (
      <div class="dui-section">
        <div class="dui-section-content">{children}</div>
        <div class="dui-section-accessory">{accessory}</div>
      </div>
    );
  };
});
export type SectionEmits = Record<string, never>;
type TextDisplayPropsInput = {
  content: string;
  referenceTime?: string | undefined;
};
export type TextDisplayProps = TextDisplayPropsInput;
export type TextDisplaySlots = Record<string, never>;
export const TextDisplay = defineRenderer<TextDisplayProps, TextDisplayPropsInput, TextDisplaySlots>("TextDisplay", ["content", "referenceTime"], [], (input, _display) => {
  return () => {
    const { content, referenceTime } = input(true);

    return <div class="dui-text-display"><Markdown content={content} referenceTime={referenceTime} /></div>;
  };
});
export type TextDisplayEmits = Record<string, never>;
type ThumbnailPropsInput = {
  media: MediaView;
};
export type ThumbnailProps = ThumbnailPropsInput;
export type ThumbnailSlots = Record<string, never>;
export const Thumbnail = defineRenderer<ThumbnailProps, ThumbnailPropsInput, ThumbnailSlots>("Thumbnail", ["media"], [], (input, _display) => {
  return () => {
    const { media } = input(true);

    return <div class="dui-thumbnail"><Media media={media} /></div>;
  };
});
export type ThumbnailEmits = Record<string, never>;
type SeparatorPropsInput = {
  divider?: boolean | undefined;
  spacing?: "small" | "large" | undefined;
};
export type SeparatorProps = SeparatorPropsInput;
export type SeparatorSlots = Record<string, never>;
export const Separator = defineRenderer<SeparatorProps, SeparatorPropsInput, SeparatorSlots>("Separator", ["divider", "spacing"], [], (input, _display) => {
  return () => {
    const { divider = true, spacing = "small" } = input(true);

    return <div role={divider ? "separator" : undefined} aria-hidden={!divider || undefined} class={`dui-separator dui-separator-${spacing}${divider ? " dui-separator-divider" : ""}`} />;
  };
});
export type SeparatorEmits = Record<string, never>;
type ActionRowPropsInput = {
  children: VNodeChild;
};
export type ActionRowProps = Omit<ActionRowPropsInput, "children">;
export type ActionRowSlots = { default?: () => VNodeChild };
export const ActionRow = defineRenderer<ActionRowProps, ActionRowPropsInput, ActionRowSlots>("ActionRow", [], ["children"], (input, _display) => {
  return () => {
    const { children } = input(true);

    return <div class="dui-action-row">{children}</div>;
  };
});
export type ActionRowEmits = Record<string, never>;
/** Link buttons navigate only for allowed HTTP(S) URLs and never when disabled. */
type LinkButtonPropsInput = {
  label: string;
  ariaLabel?: string | undefined;
  url: string;
  disabled?: boolean | undefined;
  emoji?: VNodeChild;
};
export type LinkButtonProps = Omit<LinkButtonPropsInput, "emoji">;
export type LinkButtonSlots = { emoji?: () => VNodeChild };
export const LinkButton = defineRenderer<LinkButtonProps, LinkButtonPropsInput, LinkButtonSlots>("LinkButton", [
  "label",
  "ariaLabel",
  "url",
  "disabled",
], ["emoji"], (input, _display) => {
  return () => {
    const { label, ariaLabel, url, disabled = false, emoji } = input(true);
    const href = disabled
      ? undefined
      : linkUrl(url);
    const className = `dui-component-button dui-button-link${!href
      ? " dui-component-disabled"
      : ""}`;
    const content = (
      <>
        {emoji
          ? <span class="dui-button-emoji" aria-hidden={Boolean(ariaLabel?.trim() || label.trim()) || undefined}>{emoji}</span>
          : null}
        <span class="dui-button-label">{label}</span>
        <svg class="dui-button-external-icon" aria-hidden="true" width="16" height="16" fill="none" viewBox="0 0 24 24">
          <path fill="currentColor" d="M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z" />
          <path fill="currentColor" d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z" />
        </svg>
      </>
    );
    return href
      ? <a aria-label={ariaLabel?.trim() || undefined} class={className} href={href} target="_blank" rel="noopener noreferrer">{content}</a>
      : <span aria-label={ariaLabel?.trim() || undefined} class={className} role="link" aria-disabled="true">{content}</span>;
  };
});
export type LinkButtonEmits = Record<string, never>;
type ButtonPropsInput = {
  label: string;
  ariaLabel?: string | undefined;
  variant?: "primary" | "secondary" | "success" | "danger" | "premium" | undefined;
  disabled?: boolean | undefined;
  emoji?: VNodeChild;
  onClick?: (() => void) | undefined;
};
export type ButtonProps = Omit<ButtonPropsInput, "emoji">;
export type ButtonSlots = { emoji?: () => VNodeChild };
export const Button = defineRenderer<ButtonProps, ButtonPropsInput, ButtonSlots>("Button", [
  "label",
  "ariaLabel",
  "variant",
  "disabled",
  "onClick",
], ["emoji"], (input, _display) => {
  return () => {
    const { label, ariaLabel, "variant": style = "primary", disabled = false, emoji, onClick } = input(true);

    return (
      <button type="button" aria-label={ariaLabel?.trim() || undefined} class={`dui-component-button dui-button-${style}`} disabled={disabled} onClick={() => onClick?.()}>
        {emoji
          ? <span class="dui-button-emoji" aria-hidden={Boolean(ariaLabel?.trim() || label.trim()) || undefined}>{emoji}</span>
          : null}
        <span class="dui-button-label">{label}</span>
      </button>
    );
  };
});
export type ButtonEmits = { click: Parameters<NonNullable<ButtonProps["onClick"]>> };
type FilePropsInput = {
  file: FileView;
};
export type FileProps = FilePropsInput;
export type FileSlots = Record<string, never>;
export const File = defineRenderer<FileProps, FilePropsInput, FileSlots>("File", ["file"], [], (input, display) => {
  return () => {
    const { file } = input(true);
    const { labels } = display;
    const href = linkUrl(file.url);
    const content = (
      <div class="dui-file">
        <svg class="dui-file-icon" aria-hidden="true" width="32" height="40" viewBox="0 0 32 40" fill="none">
          <path d="M5 1.5h13.5L29 12v23a3.5 3.5 0 0 1-3.5 3.5H5A3.5 3.5 0 0 1 1.5 35V5A3.5 3.5 0 0 1 5 1.5Z" stroke="currentColor" stroke-width="2" stroke-linejoin="round" />
          <path d="M18 2v10h10M8 21h14M8 27h14M8 33h8" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="dui-file-details">
          {href
            ? <a href={href} target="_blank" rel="noopener noreferrer">{file.name}</a>
            : <span>{file.name}</span>}
          {file.size
            ? <small>{file.size}</small>
            : null}
        </div>
        {href
          ? (
              <a class="dui-file-download" href={href} download={file.name} target="_blank" rel="noopener noreferrer" aria-label={labels.downloadFile.replace("{name}", file.name)} title={labels.downloadFile.replace("{name}", file.name)}>
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M12 3v12m-5-5 5 5 5-5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
                </svg>
              </a>
            )
          : null}
      </div>
    );
    return file.spoiler
      ? (
          <div class="dui-file-spoiler">
            <Spoiler
              inline={false}
              v-slots={{
                placeholder: () => (
                  <div class="dui-file dui-file-placeholder" aria-hidden="true">
                    <span class="dui-file-icon" />
                    <div class="dui-file-details">
                      <span>&nbsp;</span>
                      {file.size
                        ? <small>&nbsp;</small>
                        : null}
                    </div>
                  </div>
                ),
              }}
            >
              {content}
            </Spoiler>
          </div>
        )
      : content;
  };
});
export type FileEmits = Record<string, never>;
