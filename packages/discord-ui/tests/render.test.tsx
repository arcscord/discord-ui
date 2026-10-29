import type { MessageView } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DiscordUI, Message, MessageFrame } from "../src/index";

const message: MessageView = {
  id: "1",
  author: { id: "1", displayName: "<Alice>", bot: true },
  timestamp: "2026-10-29T18:00:00Z",
  body: { kind: "text", content: "<script>alert(1)</script>" },
};

it("renders escaped message data and explicit UTC dates on the server", () => {
  const html = renderToStaticMarkup(<Message message={message} />);
  expect(html).toContain("&lt;Alice&gt;");
  expect(html).toContain("&lt;script&gt;");
  expect(html).not.toContain("<script>");
  expect(html.toLowerCase()).toContain("datetime=\"2026-10-29t18:00:00.000z\"");
  expect(html).toContain("6:00 PM");
});

it("uses explicit theme and timezone without the host clock", () => {
  const html = renderToStaticMarkup(<DiscordUI theme="light" locale="en-US" timeZone="Europe/Zurich"><Message message={message} /></DiscordUI>);
  expect(html).toContain("data-theme=\"light\"");
  expect(html).toContain("7:00 PM");
});

it("supports explicit composition with wrapped children", () => {
  const html = renderToStaticMarkup(<MessageFrame header={<span>Custom header</span>} footer={<span>Footer</span>}><section>Body</section></MessageFrame>);
  expect(html).toContain("Custom header");
  expect(html).toContain("<section>Body</section>");
  expect(html).toContain("Footer");
});

it("keeps unsafe avatar sources out of server markup", () => {
  const html = renderToStaticMarkup(
    <Message message={{
      ...message,
      author: { ...message.author, avatarUrl: "javascript:alert(1)" },
    }}
    />,
  );
  expect(html).not.toContain("javascript:");
  expect(html).not.toContain("<img");
});
