import type { ComponentProps } from "svelte";
import type { ChannelViewProps, ComponentHandlers, DiscordUIProps, MessageProps, MessageView, SelectMenuProps } from "../src/index.js";
import * as react from "@arcscord/discord-ui";
import { render } from "svelte/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import { demoChannel } from "../../../fixtures/channel.js";
import * as svelte from "../src/index.js";
import EmbedFixture from "./EmbedFixture.svelte";
import MediaFixture from "./MediaFixture.svelte";
import RenderFixture from "./RenderFixture.svelte";

describe("svelte public surface", () => {
  it("exposes a native Svelte component for every public React component", () => {
    const components = Object.keys(react).filter(name => /^[A-Z]/u.test(name)).sort();
    const exports = Object.keys(svelte).filter(name => /^[A-Z]/u.test(name)).sort();
    expect(exports).toEqual(components);
    expect(exports).toHaveLength(37);
    for (const name of exports)
      expect(svelte[name as keyof typeof svelte]).toBeTypeOf("function");
  });

  it("keeps component props and host contracts typed", () => {
    expectTypeOf<ComponentProps<typeof svelte.Message>>().toEqualTypeOf<MessageProps>();
    expectTypeOf<ComponentProps<typeof svelte.ChannelView>>().toEqualTypeOf<ChannelViewProps>();
    expectTypeOf<ComponentProps<typeof svelte.DiscordUI>>().toEqualTypeOf<DiscordUIProps>();
    expectTypeOf<ComponentProps<typeof svelte.SelectMenu>>().toEqualTypeOf<SelectMenuProps>();
    expectTypeOf<MessageProps["onSelectChange"]>().toEqualTypeOf<ComponentHandlers["onSelectChange"]>();
    expectTypeOf<{
      id: string;
      author: MessageView["author"];
      timestamp: string;
      body: { kind: "components-v2"; components: [] };
      embeds: [];
    }>().not.toMatchTypeOf<MessageView>();
  });
});

describe("svelte server rendering", () => {
  it("renders classic and V2 messages with scoped themes, media policy and opt-in highlighting", () => {
    const { body } = render(RenderFixture);
    expect(body).toContain("data-theme=\"fixture\" data-base-theme=\"ash\"");
    expect(body).toContain("data-theme=\"light\" data-base-theme=\"light\"");
    expect(body).toContain("--discord-ui-accent:#7733aa");
    expect(body).toContain("Adjusted");
    expect(body).toContain("dui-embed");
    expect(body).toContain("dui-media-gallery");
    expect(body).toContain("dui-components-v2");
    expect(body).toContain("hljs-keyword");
    expect(body).toContain("dui-revealable-media");
    expect(body).not.toContain("alt=\"Paysage masqué\"");
    expect(body.match(/src="https:\/\/cdn\.example\.test\/avatar\.png"/gu)).toHaveLength(1);
  });

  it("escapes message content and applies the shared URL policy", () => {
    const { body } = render(RenderFixture);
    expect(body).not.toContain("<script>sentinel");
    expect(body).not.toContain("href=\"javascript:");
    expect(body).toContain("unsafe");
  });

  it("renders all menu types and distinguishes default values from an empty controlled selection", () => {
    const { body } = render(RenderFixture);
    for (const kind of [
      "string-select",
      "user-select",
      "role-select",
      "mentionable-select",
      "channel-select",
    ])
      expect(body).toContain(`data-kind="${kind}"`);
    expect(body).toContain("Releases");
    expect(body).not.toContain("Default hidden");
  });

  it("renders focused-control IDs and dates deterministically across renders", () => {
    const options = { idPrefix: "fixture-" };
    const { body } = render(RenderFixture, options);
    expect(render(RenderFixture, options).body).toBe(body);
    expect(body).toMatch(/aria-describedby="fixture-[^"]+"/u);
    expect(body).toContain("October 29, 2026");
    expect(render(RenderFixture, {
      props: { locale: "fr-FR" },
    }).body).toContain("29 octobre 2026");
  });

  it("scopes a standalone channel once and respects an explicitly closed thread", () => {
    const { body } = render(svelte.ChannelView, {
      props: { channel: demoChannel, activeThreadId: null, composer: false },
    });
    expect(body.match(/arcscord-discord-ui/gu)).toHaveLength(1);
    expect(body).toContain("dui-thread-preview");
    expect(body).not.toContain("class=\"dui-thread-panel\"");
    expect(body).not.toContain("class=\"dui-channel-composer\"");
  });
});

describe("svelte media rendering", () => {
  it("renders custom video and voice controls with deterministic initial state", () => {
    const { body } = render(MediaFixture, {
      props: { allowRemoteMedia: true },
    });
    expect(body).toContain("<video");
    expect(body).toContain("<audio");
    expect(body).toContain("preload=\"none\"");
    expect(body).not.toContain("autoplay");
    expect(body).toContain("aria-label=\"Play\"");
    expect(body).toContain("dui-waveform-bar");
    expect(body).toContain("0:00 / 0:02");
    expect(body).toContain("alt=\"Wave\"");
    expect(body).toContain("Unsupported sticker format");
    expect(body).not.toContain("src=\"https://media.example.test/sticker.json\"");
    expect(body).not.toContain("src=\"/hidden.mp4\"");
    expect(body).not.toContain("src=\"/hidden.ogg\"");
    expect(render(MediaFixture, {
      props: { allowRemoteMedia: true },
    }).body).toBe(body);
  });

  it("blocks remote player, poster and sticker sources while retaining local images", () => {
    const { body } = render(MediaFixture);
    expect(body).not.toContain("<video");
    expect(body).not.toContain("<audio");
    expect(body).not.toContain("src=\"https://media.example.test/");
    expect(body).not.toContain("poster=\"https://media.example.test/");
    expect(body).toContain("src=\"/image.png\"");
    expect(body).toContain("Media unavailable");
  });

  it("keeps public component model props typed", () => {
    expectTypeOf<ComponentProps<typeof svelte.Video>>().toEqualTypeOf<svelte.VideoProps>();
    expectTypeOf<ComponentProps<typeof svelte.Audio>>().toEqualTypeOf<svelte.AudioProps>();
    expectTypeOf<ComponentProps<typeof svelte.Sticker>>().toEqualTypeOf<svelte.StickerProps>();
  });
  it("renders an author server tag with an optional badge", () => {
    const { body } = render(svelte.Author, {
      props: {
        author: {
          id: "chris",
          displayName: "Chris",
          tag: { text: "DEV", badgeUrl: "/tag.png" },
        },
      },
    });
    expect(body).toContain("<span class=\"dui-author-tag\">");
    expect(body).toContain("<img class=\"dui-author-tag-badge\" src=\"/tag.png\" alt=\"\" width=\"13\" height=\"13\"/>");
    expect(body).toContain("<span class=\"dui-author-tag-text\">DEV</span>");
    expect(body.indexOf("dui-author-tag-badge")).toBeLessThan(body.indexOf("dui-author-tag-text"));
    expect(render(svelte.Author, {
      props: {
        author: {
          id: "chris",
          displayName: "Chris",
          tag: { text: "DEV" },
        },
      },
    }).body).not.toContain("<img");
  });
});

describe("svelte role mentions", () => {
  it("tints colored role mentions with the role color at 10% fill and 30% hover", () => {
    const role = render(svelte.Mention, {
      props: {
        id: "1",
        kind: "role",
        name: "Test 3",
        color: "#4612a4",
      },
    }).body;
    expect(role).toContain("--discord-ui-mention-fill: #4612a41a;");
    expect(role).toContain("--discord-ui-mention-fill-hover: #4612a44d;");
    const user = render(svelte.Mention, {
      props: {
        id: "1",
        kind: "user",
        name: "Alice",
        color: "#4612a4",
      },
    }).body;
    expect(user).not.toContain("--discord-ui-mention-fill");
  });
});

describe("svelte embed inline Markdown", () => {
  it("renders custom emojis and inline formatting in titles and field names", () => {
    for (const url of [undefined, "https://example.com/ticket"]) {
      const html = render(EmbedFixture, {
        props: { url },
      }).body;
      const title = /<div class="dui-embed-title">(.*?)<\/div>/su.exec(html)?.[1] ?? "";
      const field = /<strong class="dui-embed-field-name">(.*?)<\/strong>/su.exec(html)?.[1] ?? "";
      for (const zone of [title, field]) {
        expect(zone).toMatch(/<img class="dui-emoji"[^>]* src="\/emoji\.svg"/u);
        expect(zone).not.toContain("&lt;:id:");
      }
      expect(title).toMatch(/<strong>(?:<!--[^>]*-->)*Ticket(?:<!--[^>]*-->)*<\/strong>/u);
      expect(title).toContain("&lt;@123>");
      expect(title).not.toContain("dui-mention");
      expect(html).toContain("aria-label=\":id: Ticket fermé &lt;@123>\"");
      if (url)
        expect(title).toMatch(/^(?:\s|<!--[^>]*-->)*<a href="https:\/\/example\.com\/ticket"/u);
    }
  });
});
