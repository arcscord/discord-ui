import type { CSSProperties, ReactNode } from "react";
import type { FileView } from "../../model/components";
import type { MediaView } from "../../model/content";
import { linkUrl } from "../../utils/urls";
import { Markdown } from "../content/markdown";
import { Spoiler } from "../content/spoiler";
import { useDisplayOptions } from "../display-context";
import { Media } from "../media/media";

export function Container({ children, accentColor, spoiler = false }: { children: ReactNode; accentColor?: string | undefined; spoiler?: boolean | undefined }) {
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

export function Section({ children, accessory }: { children: ReactNode; accessory: ReactNode }) {
  return (
    <div className="dui-section">
      <div className="dui-section-content">{children}</div>
      <div className="dui-section-accessory">{accessory}</div>
    </div>
  );
}

export function TextDisplay({ content, referenceTime }: { content: string; referenceTime?: string | undefined }) {
  return <div className="dui-text-display"><Markdown content={content} referenceTime={referenceTime} /></div>;
}

export function Thumbnail({ media }: { media: MediaView }) {
  return <div className="dui-thumbnail"><Media media={media} /></div>;
}

export function Separator({ divider = true, spacing = "small" }: { divider?: boolean | undefined; spacing?: "small" | "large" | undefined }) {
  return <div role={divider ? "separator" : undefined} aria-hidden={!divider || undefined} className={`dui-separator dui-separator-${spacing}${divider ? " dui-separator-divider" : ""}`} />;
}

export function ActionRow({ children }: { children: ReactNode }) {
  return <div className="dui-action-row">{children}</div>;
}

/** Link buttons navigate only for allowed HTTP(S) URLs and never when disabled. */
export function LinkButton({ label, url, disabled = false, emoji }: { label: string; url: string; disabled?: boolean | undefined; emoji?: ReactNode }) {
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

export function Button({ label, style = "primary", disabled = false, emoji, onClick }: { label: string; style?: "primary" | "secondary" | "success" | "danger" | "premium" | undefined; disabled?: boolean | undefined; emoji?: ReactNode; onClick?: (() => void) | undefined }) {
  return (
    <button type="button" className={`dui-component-button dui-button-${style}`} disabled={disabled} onClick={onClick}>
      {emoji
        ? <span className="dui-button-emoji" aria-hidden="true">{emoji}</span>
        : null}
      <span className="dui-button-label">{label}</span>
    </button>
  );
}

export function File({ file }: { file: FileView }) {
  const { labels } = useDisplayOptions();
  const href = linkUrl(file.url);
  const content = (
    <div className="dui-file">
      <span className="dui-file-icon" aria-hidden="true">▤</span>
      <div className="dui-file-details">
        {href
          ? <a href={href} target="_blank" rel="noopener noreferrer">{file.name}</a>
          : <span>{file.name}</span>}
        {file.size
          ? <small>{file.size}</small>
          : null}
      </div>
      {href
        ? <a href={href} target="_blank" rel="noopener noreferrer" aria-label={labels.downloadFile.replace("{name}", file.name)}>↓</a>
        : null}
    </div>
  );
  return file.spoiler
    ? <Spoiler inline={false}>{content}</Spoiler>
    : content;
}
