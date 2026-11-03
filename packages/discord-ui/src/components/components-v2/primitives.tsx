import type { CSSProperties, ReactNode } from "react";
import type { FileView } from "../../model/components";
import type { MediaView } from "../../model/content";
import { linkUrl } from "../../utils/urls";
import { Markdown } from "../content/markdown";
import { Spoiler } from "../content/spoiler";
import { useDisplayOptions } from "../display-context";
import { Media } from "../media/media";

export type ContainerProps = { children: ReactNode; accentColor?: string | undefined; spoiler?: boolean | undefined };

export function Container({ children, accentColor, spoiler = false }: ContainerProps) {
  const color = /^#[a-f\d]{6}$/iu.test(accentColor ?? "")
    ? accentColor
    : undefined;
  const content = (
    <div
      className={`dui-container${color ? " dui-container-accented" : ""}`}
      style={color
        ? { "--discord-ui-container-accent": color } as CSSProperties
        : undefined}
    >
      {children}
    </div>
  );
  return spoiler
    ? <Spoiler inline={false}>{content}</Spoiler>
    : content;
}

export type SectionProps = { children: ReactNode; accessory: ReactNode };

export function Section({ children, accessory }: SectionProps) {
  return (
    <div className="dui-section">
      <div className="dui-section-content">{children}</div>
      <div className="dui-section-accessory">{accessory}</div>
    </div>
  );
}

export type TextDisplayProps = { content: string; referenceTime?: string | undefined };

export function TextDisplay({ content, referenceTime }: TextDisplayProps) {
  return <div className="dui-text-display"><Markdown content={content} referenceTime={referenceTime} /></div>;
}

export type ThumbnailProps = { media: MediaView };

export function Thumbnail({ media }: ThumbnailProps) {
  return <div className="dui-thumbnail"><Media media={media} /></div>;
}

export type SeparatorProps = { divider?: boolean | undefined; spacing?: "small" | "large" | undefined };

export function Separator({ divider = true, spacing = "small" }: SeparatorProps) {
  return <div role={divider ? "separator" : undefined} aria-hidden={!divider || undefined} className={`dui-separator dui-separator-${spacing}${divider ? " dui-separator-divider" : ""}`} />;
}

export type ActionRowProps = { children: ReactNode };

export function ActionRow({ children }: ActionRowProps) {
  return <div className="dui-action-row">{children}</div>;
}

/** Link buttons navigate only for allowed HTTP(S) URLs and never when disabled. */
export type LinkButtonProps = { label: string; url: string; disabled?: boolean | undefined; emoji?: ReactNode };

export function LinkButton({ label, url, disabled = false, emoji }: LinkButtonProps) {
  const href = disabled
    ? undefined
    : linkUrl(url);
  const className = `dui-component-button dui-button-link${!href
    ? " dui-component-disabled"
    : ""}`;
  const content = (
    <>
      {emoji
        ? <span className="dui-button-emoji" aria-hidden="true">{emoji}</span>
        : null}
      <span className="dui-button-label">{label}</span>
      <svg className="dui-button-external-icon" aria-hidden="true" width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path fill="currentColor" d="M15 2a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v6a1 1 0 1 1-2 0V4.41l-4.3 4.3a1 1 0 1 1-1.4-1.42L19.58 3H16a1 1 0 0 1-1-1Z" />
        <path fill="currentColor" d="M5 2a3 3 0 0 0-3 3v14a3 3 0 0 0 3 3h14a3 3 0 0 0 3-3v-6a1 1 0 1 0-2 0v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1h6a1 1 0 1 0 0-2H5Z" />
      </svg>
    </>
  );
  return href
    ? <a className={className} href={href} target="_blank" rel="noopener noreferrer">{content}</a>
    : <span className={className} role="link" aria-disabled="true">{content}</span>;
}

export type ButtonProps = { label: string; style?: "primary" | "secondary" | "success" | "danger" | "premium" | undefined; disabled?: boolean | undefined; emoji?: ReactNode; onClick?: (() => void) | undefined };

export function Button({ label, style = "primary", disabled = false, emoji, onClick }: ButtonProps) {
  return (
    <button type="button" className={`dui-component-button dui-button-${style}`} disabled={disabled} onClick={onClick}>
      {emoji
        ? <span className="dui-button-emoji" aria-hidden="true">{emoji}</span>
        : null}
      <span className="dui-button-label">{label}</span>
    </button>
  );
}

export type FileProps = { file: FileView };

export function File({ file }: FileProps) {
  const { labels } = useDisplayOptions();
  const href = linkUrl(file.url);
  const content = (
    <div className="dui-file">
      <svg className="dui-file-icon" aria-hidden="true" width="32" height="40" viewBox="0 0 32 40" fill="none">
        <path d="M5 1.5h13.5L29 12v23a3.5 3.5 0 0 1-3.5 3.5H5A3.5 3.5 0 0 1 1.5 35V5A3.5 3.5 0 0 1 5 1.5Z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round" />
        <path d="M18 2v10h10M8 21h14M8 27h14M8 33h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <div className="dui-file-details">
        {href
          ? <a href={href} target="_blank" rel="noopener noreferrer">{file.name}</a>
          : <span>{file.name}</span>}
        {file.size
          ? <small>{file.size}</small>
          : null}
      </div>
      {href
        ? (
            <a className="dui-file-download" href={href} download={file.name} target="_blank" rel="noopener noreferrer" aria-label={labels.downloadFile.replace("{name}", file.name)} title={labels.downloadFile.replace("{name}", file.name)}>
              <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M12 3v12m-5-5 5 5 5-5M4 15v5a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
          )
        : null}
    </div>
  );
  return file.spoiler
    ? <Spoiler inline={false}>{content}</Spoiler>
    : content;
}
