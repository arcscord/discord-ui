import type { EmbedView } from "../../model/content";
import { linkUrl, mediaUrl } from "../../utils/urls";
import { Emoji } from "../content/emoji";
import { Markdown } from "../content/markdown";
import { useDisplayOptions } from "../display-context";
import { Media } from "../media/media";
import { MessageTimestamp } from "../message/message-timestamp";

export function Embed({ embed, referenceTime }: { embed: EmbedView; referenceTime?: string | undefined }) {
  const { allowRemoteMedia } = useDisplayOptions();
  const url = linkUrl(embed.url);
  const authorUrl = linkUrl(embed.author?.url);
  const color = /^#[a-f\d]{6}$/iu.test(embed.color ?? "")
    ? embed.color
    : undefined;
  const footerImage = mediaUrl(embed.footer?.iconUrl, allowRemoteMedia);
  const authorImage = mediaUrl(embed.author?.iconUrl, allowRemoteMedia);
  return (
    <section
      className="dui-embed"
      style={color
        ? { borderLeftColor: color }
        : undefined}
      aria-label={embed.title}
    >
      <div className="dui-embed-main">
        {embed.author
          ? (
              <div className="dui-embed-author">
                {authorImage
                  ? <Emoji name={embed.author.name} image={authorImage} />
                  : null}
                {authorUrl
                  ? <a href={authorUrl} target="_blank" rel="noreferrer noopener">{embed.author.name}</a>
                  : embed.author.name}
              </div>
            )
          : null}
        {embed.title
          ? (
              <div className="dui-embed-title">
                {url
                  ? <a href={url} target="_blank" rel="noreferrer noopener">{embed.title}</a>
                  : embed.title}
              </div>
            )
          : null}
        {embed.description
          ? <Markdown content={embed.description} referenceTime={referenceTime} />
          : null}
        {embed.fields?.length
          ? (
              <div className="dui-embed-fields">
                {embed.fields.map(field => (
                  <div key={field.id} className={field.inline ? "dui-embed-field-inline" : "dui-embed-field"}>
                    <strong>{field.name}</strong>
                    <Markdown content={field.value} referenceTime={referenceTime} />
                  </div>
                ))}
              </div>
            )
          : null}
      </div>
      {embed.thumbnail
        ? <div className="dui-embed-thumbnail"><Media media={embed.thumbnail} /></div>
        : null}
      {embed.image
        ? <div className="dui-embed-image"><Media media={embed.image} /></div>
        : null}
      {embed.footer || embed.timestamp
        ? (
            <footer className="dui-embed-footer">
              {footerImage
                ? <Emoji name="" image={footerImage} />
                : null}
              {embed.footer?.text}
              {embed.timestamp
                ? <MessageTimestamp timestamp={embed.timestamp} />
                : null}
            </footer>
          )
        : null}
    </section>
  );
}
