import type { MessageView } from "../src/index";
import { expect, expectTypeOf, it } from "vitest";

it("keeps a text message serializable without losing author or timezone metadata", () => {
  const message = {
    id: "message-1",
    author: { id: "author-1", displayName: "Example", bot: true },
    timestamp: "2026-10-29T18:00:00Z",
    body: { kind: "text", content: "Hello" },
  } satisfies MessageView;

  expect(JSON.parse(JSON.stringify(message))).toEqual(message);
  expectTypeOf(message).toExtend<MessageView>();
  expectTypeOf<MessageView["body"]["kind"]>().toEqualTypeOf<"text" | "markdown" | "components-v2">();
});
