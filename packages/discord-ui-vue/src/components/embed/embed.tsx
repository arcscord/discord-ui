import type { EmbedView } from "@arcscord/discord-ui-core";
// Vue rendering adapted from the React adapter; see THIRD_PARTY_NOTICES.
import { linkUrl, mediaUrl } from "@arcscord/discord-ui-core";
import { defineRenderer, styleValue } from "../../rendering";
import { Emoji } from "../content/emoji";
import { Markdown } from "../content/markdown";
import { Media } from "../media/media";
import { MessageTimestamp } from "../message/message-timestamp";

type EmbedPropsInput = {
  embed: EmbedView;
  referenceTime?: string | undefined;
};
export type EmbedProps = EmbedPropsInput;
export type EmbedSlots = Record<string, never>;
export const Embed = defineRenderer<EmbedProps, EmbedPropsInput, EmbedSlots>("Embed", ["embed", "referenceTime"], [], (input, display) => {
  return () => {
    const { embed, referenceTime } = input(true);
    const { allowRemoteMedia } = display;
    const url = linkUrl(embed.url);
    const authorUrl = linkUrl(embed.author?.url);
    const color = /^#[a-f\d]{6}$/iu.test(embed.color ?? "")
      ? embed.color
      : undefined;
    const footerImage = mediaUrl(embed.footer?.iconUrl, allowRemoteMedia);
    const authorImage = mediaUrl(embed.author?.iconUrl, allowRemoteMedia);
    return (
      <section
        class="dui-embed"
        style={styleValue(color
          ? { borderLeftColor: color }
          : undefined)}
        aria-label={embed.title}
      >
        <div class="dui-embed-main">
          {embed.author
            ? (
                <div class="dui-embed-author">
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
                <div class="dui-embed-title">
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
                <div class="dui-embed-fields">
                  {embed.fields.map(field => (
                    <div key={field.id} class={field.inline ? "dui-embed-field-inline" : "dui-embed-field"}>
                      <strong>{field.name}</strong>
                      <Markdown content={field.value} referenceTime={referenceTime} />
                    </div>
                  ))}
                </div>
              )
            : null}
        </div>
        {embed.thumbnail
          ? <div class="dui-embed-thumbnail"><Media media={embed.thumbnail} /></div>
          : null}
        {embed.image
          ? <div class="dui-embed-image"><Media media={embed.image} /></div>
          : null}
        {embed.footer || embed.timestamp
          ? (
              <footer class="dui-embed-footer">
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
  };
});
export type EmbedEmits = Record<string, never>;
