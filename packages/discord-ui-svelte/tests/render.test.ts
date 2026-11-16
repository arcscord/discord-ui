import type { ComponentProps } from "svelte";
import type { ChannelViewProps, ComponentHandlers, DiscordUIProps, MessageProps, MessageView, SelectMenuProps } from "../src/index.js";
import * as react from "@arcscord/discord-ui";
import { render } from "svelte/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import { demoChannel } from "../../../fixtures/channel.js";
import * as svelte from "../src/index.js";
import RenderFixture from "./RenderFixture.svelte";

describe("svelte public surface", () => {
  it("exposes a native Svelte component for every public React component", () => {
    const components = Object.keys(react).filter(name => /^[A-Z]/u.test(name)).sort();
    const exports = Object.keys(svelte).filter(name => /^[A-Z]/u.test(name)).sort();
    expect(exports).toEqual(components);
    expect(exports).toHaveLength(34);
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
