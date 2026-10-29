import type { MessageView, ThreadSummaryView } from "../src/index";
import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { DiscordUI, Message, ThreadPreview } from "../src/index";

const summary: ThreadSummaryView = {
  id: "thread",
  name: "image-discussion",
  messageCount: 1,
  lastMessage: {
    author: { id: "bot", displayName: "Auto Threads", bot: true },
    content: "<script>message</script>",
    timestamp: "2026-10-29T18:03:00Z",
  },
};
const message: MessageView = {
  id: "parent",
  author: { id: "chris", displayName: "Chris" },
  timestamp: "2026-10-29T18:01:00Z",
  body: { kind: "text", content: "An image" },
  thread: summary,
};

it("renders the connector, count, author and escaped last-message preview", () => {
  const html = renderToStaticMarkup(<DiscordUI referenceTime="2026-10-29T18:30:00Z"><Message message={message} /></DiscordUI>);
  expect(html).toContain("data-has-thread=\"true\"");
  expect(html).toContain("image-discussion");
  expect(html).toContain("1 message");
  expect(html).toContain("Auto Threads");
  expect(html).toContain("&lt;script&gt;message&lt;/script&gt;");
  expect(html).not.toContain("<script>");
  expect(html).toContain("dateTime=\"2026-10-29T18:03:00.000Z\"");
  expect(html).not.toContain("type=\"button\"");
});

it("makes summaries interactive only when an open handler is supplied", () => {
  const html = renderToStaticMarkup(<ThreadPreview thread={summary} onOpen={() => {}} active />);
  expect(html).toContain("type=\"button\"");
  expect(html).toContain("aria-expanded=\"true\"");
  expect(html).toContain("Open thread image-discussion");
  const empty = renderToStaticMarkup(<ThreadPreview thread={{ id: "empty", name: "Empty", messageCount: 0 }} />);
  expect(empty).toContain("0 messages");
  expect(empty).toContain("No recent messages in this thread.");
});

it("blocks remote avatars in thread previews using the shared media policy", () => {
  const html = renderToStaticMarkup(
    <DiscordUI allowRemoteMedia={false}>
      <ThreadPreview thread={{
        ...summary,
        lastMessage: {
          ...summary.lastMessage!,
          author: { id: "bot", displayName: "Remote", avatarUrl: "https://example.com/avatar.png" },
        },
      }}
      />
    </DiscordUI>,
  );
  expect(html).not.toContain("https://example.com");
  expect(html).not.toContain("<img");
});
