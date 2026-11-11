import type { MessageView } from "@arcscord/discord-ui-core";
import { readFileSync } from "node:fs";
import * as ReactUI from "@arcscord/discord-ui";
import { renderToString } from "@vue/server-renderer";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, expectTypeOf, it } from "vitest";
import { createSSRApp, h } from "vue";
import { demoChannel } from "../../../fixtures/channel";
import { basicMessage, componentsV2Message, demoEntities, embedMessage, interactiveMessage, markdownMessage, mediaMessage, reactionsMessage, unavailableMessage } from "../../../fixtures/messages";
import { renderHighlightedCode } from "../src/highlight";
import * as VueUI from "../src/index";

async function render(component: Parameters<typeof h>[0], props: Record<string, unknown> = {}, theme: import("@arcscord/discord-ui-core").ThemeName = "dark"): Promise<string> {
  return renderToString(createSSRApp({
    render: () => h(VueUI.DiscordUI, { theme, entities: demoEntities }, {
      default: () => h(component, props),
    }),
  }));
}

it("exports every public React component and its shared model identity", () => {
  const source = readFileSync(new URL("../../discord-ui/src/index.ts", import.meta.url), "utf8");
  const components = [
    ...source.matchAll(/^export \{ ([^}]+) \} from "\.\/components\//gmu),
  ].flatMap(match => match[1]!.split(", "));
  for (const name of components)
    expect(VueUI).toHaveProperty(name);
  expectTypeOf<VueUI.MessageView>().toEqualTypeOf<MessageView>();
});

describe("shared fixture SSR parity", () => {
  for (const theme of ["light", "ash", "dark"] as const) {
    for (const message of [
      basicMessage,
      markdownMessage,
      mediaMessage,
      embedMessage,
      unavailableMessage,
      componentsV2Message,
      reactionsMessage,
      interactiveMessage,
    ]) {
      it(`${theme}: ${message.id}`, async () => {
        const html = await render(VueUI.Message, { message }, theme);
        expect(html).toContain(`data-theme="${theme}"`);
        expect(html).toContain("dui-message");
        expect(html).toContain(message.author.displayName);
        expect(html).not.toContain("[object Object]");
        expect(html).not.toContain("NaN");
        const react = renderToStaticMarkup(createElement(ReactUI.DiscordUI, {
          theme,
          entities: demoEntities,
          children: createElement(ReactUI.Message, { message }),
        }));
        const text = (value: string): string => value.replace(/<!--[\s\S]*?-->/gu, "").replace(/<[^>]*>/gu, "").replace(/&#(?:x27|39);/gu, "'").replace(/\s+/gu, "");
        expect(text(html)).toBe(text(react));
        expect(await render(VueUI.Message, { message }, theme)).toBe(html);
      });
    }
  }
});
it("renders Markdown, code, slots and custom inherited themes without HTML injection", async () => {
  const theme = VueUI.defineTheme({
    name: "brand",
    extends: "light",
    tokens: { accent: "#123456" },
  });
  const html = await renderToString(createSSRApp({
    render: () => h(VueUI.DiscordUI, { theme, renderCode: renderHighlightedCode }, {
      default: () => [
        h(VueUI.Markdown, { content: "**bold**\n- item\n```ts\nconst a = '<script>';\n```" }),
        h(VueUI.Section, {}, {
          default: () => "main",
          accessory: () => "accessory",
        }),
      ],
    }),
  }));
  const markup = html.replace(/<!--[\s\S]*?-->/gu, "");
  expect(markup).toContain("<strong>bold</strong>");
  expect(markup).toContain("<li>item</li>");
  expect(html).toContain("hljs-keyword");
  expect(html).toContain("&lt;script&gt;");
  expect(markup).toContain("dui-section-accessory\">accessory");
  expect(html).toContain("--discord-ui-accent:#123456");
  expect(html).toContain("data-base-theme=\"light\"");
});
it("blocks remote media and preserves emoji and unavailable-media fallbacks", async () => {
  const message: MessageView = {
    ...mediaMessage,
    author: { ...mediaMessage.author, avatarUrl: "https://example.com/a.png" },
  };
  const html = await renderToString(createSSRApp({
    render: () => h(VueUI.DiscordUI, { allowRemoteMedia: false }, {
      default: () => h(VueUI.Message, { message }),
    }),
  }));
  expect(html).not.toContain("src=\"https://");
  const emoji = await renderToString(createSSRApp({
    render: () => h(VueUI.DiscordUI, {
      allowRemoteMedia: false,
      unicodeEmoji: { mode: "twemoji", baseUrl: "/emoji" },
    }, {
      default: () => h(VueUI.Emoji, { name: "❤️" }),
    }),
  }));
  expect(emoji).toContain("src=\"/emoji/2764.svg\"");
});
it("renders controlled selections, channels and local thread navigation on the server", async () => {
  const menu = {
    id: "pick",
    kind: "string-select",
    minValues: 0,
    options: [
      { value: "a", label: "Alpha", default: true },
      { value: "b", label: "Beta" },
    ],
  } as const;
  expect(await render(VueUI.SelectMenu, {
    menu,
    values: ["b"],
  })).toContain("Beta");
  expect(await render(VueUI.SelectMenu, { menu, values: [] })).not.toContain("dui-select-value\">Alpha");
  const html = await render(VueUI.ChannelView, { channel: demoChannel, height: 560 });
  expect(html).toContain("height:560px");
  expect(html).toContain("dui-channel-history");
  expect(html).toContain("dui-channel-composer");
});

it("keeps replies, edited markers, ephemeral actions and spoiler files distinct", async () => {
  const base = {
    id: "details",
    author: { id: "a", displayName: "Author" },
    timestamp: "2026-11-01T00:00:00Z",
    body: { kind: "text", content: "Details" },
  } as const;
  const message: MessageView = {
    ...base,
    edited: true,
    ephemeral: true,
    reply: {
      kind: "interaction",
      author: { id: "u", displayName: "<User>" },
      commandName: "settings <script>",
    },
    attachments: [
      {
        id: "file",
        kind: "file",
        name: "public.txt",
        url: "https://example.com/public.txt",
      },
      {
        id: "spoiler",
        kind: "file",
        name: "secret.txt",
        url: "https://example.com/secret.txt",
        spoiler: true,
      },
      {
        id: "unsafe",
        kind: "file",
        name: "unsafe.txt",
        url: "javascript:alert(1)",
      },
    ],
  };
  const html = await render(VueUI.Message, {
    message,
    onEphemeralDismiss: () => {},
  });
  expect(html).toContain("(edited)");
  expect(html).toContain("&lt;User&gt;");
  expect(html).toContain("/settings &lt;script&gt;");
  expect(html).toContain("Dismiss message");
  expect(html).toContain("public.txt");
  expect(html).not.toContain("secret.txt");
  expect(html).not.toContain("javascript:");
  expect(html.match(/<article/gu)).toHaveLength(1);
  const unavailable = await render(VueUI.Message, {
    message: {
      ...base,
      reply: { messageId: "gone", unavailable: true },
    },
  });
  expect(unavailable).toContain("Original message unavailable");
  expect(unavailable).not.toContain("dui-message-edited");
});
it("preserves grapheme avatar fallbacks, safe colors and multiple SSR app isolation", async () => {
  const author = {
    id: "alex",
    displayName: "Alex",
    avatarFallback: { letter: "👩🏽‍💻", background: "#337c96", color: "#ffcc00" },
  };
  const html = await render(VueUI.Avatar, { author });
  expect(html).toContain("👩🏽‍💻");
  expect(html).toContain("background:#337c96;color:#ffcc00");
  const safe = await render(VueUI.Avatar, {
    author: {
      id: "x",
      displayName: "",
      avatarFallback: { letter: "<script>", background: "url(https://example.com)", color: "red" },
    },
  });
  expect(safe).toContain("&lt;");
  expect(safe).not.toContain("url(");
  const menu = {
    id: "pick",
    kind: "string-select",
    options: [
      { value: "a", label: "Alpha" },
    ],
  } as const;
  const makeApp = (prefix: string) => {
    const app = createSSRApp({
      render: () => h(VueUI.ThreadPreview, {
        thread: { id: menu.id, name: "Isolated", messageCount: 0 },
      }),
    });
    app.config.idPrefix = prefix;
    return app;
  };
  const [first, second] = await Promise.all([
    renderToString(makeApp("one-")),
    renderToString(makeApp("two-")),
  ]);
  expect(first).toContain("one-");
  expect(second).toContain("two-");
});

it("allows remote media by default and blocks it only when requested", async () => {
  const author = { id: "remote", displayName: "Remote", avatarUrl: "https://example.com/avatar.png" };
  expect(await render(VueUI.Avatar, { author })).toContain("src=\"https://example.com/avatar.png\"");
  const blocked = await renderToString(createSSRApp({
    render: () => h(VueUI.DiscordUI, { allowRemoteMedia: false }, {
      default: () => h(VueUI.Avatar, { author }),
    }),
  }));
  expect(blocked).not.toContain("https://example.com/avatar.png");
});

it("types component ref events without permitting unknown names or invalid payloads", () => {
  function check(menu: InstanceType<typeof VueUI.SelectMenu>, channel: InstanceType<typeof VueUI.ChannelView>): void {
    menu.$emit("update:values", ["a"]);
    channel.$emit("update:activeThreadId", null);
    // @ts-expect-error Select values are strings.
    menu.$emit("update:values", [42]);
    // @ts-expect-error Unknown events are rejected.
    menu.$emit("unrecognized", []);
    // @ts-expect-error Thread IDs are strings or null.
    channel.$emit("update:activeThreadId", 42);
  }
  void check;
});
