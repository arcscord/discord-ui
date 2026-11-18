import type { FrameLocator } from "@playwright/test";
import type { NativeEvent, Snapshot } from "../../apps/comparison/src/previews/protocol";
import { expect, test } from "@playwright/test";
import { frameworks } from "../../fixtures/comparison/scenarios";
import { createRunner } from "./support/runner";

// Expected outcomes are literal contracts, independent of the native host's reducer.
const initial: Snapshot = {
  waves: 0,
  reacted: false,
  selectValues: { topics: [] },
  activeThreadId: null,
  messageCount: 1,
  replyCount: 0,
};
const selection: NativeEvent = {
  name: "select-change",
  args: [
    "topics",
    ["maps"],
    { messageId: "poll", componentId: "topics" },
  ],
};
const wave: NativeEvent = {
  name: "button-click",
  args: [
    "wave",
    { messageId: "poll", componentId: "wave" },
  ],
};

type Runner = ReturnType<typeof createRunner>;
async function classic(runner: Runner): Promise<void> {
  await runner.checkpoint("initial", initial, [], async (document) => {
    await expect(document.getByText("Trail notes", { exact: true })).toBeVisible();
    await expect(document.getByText("(edited)", { exact: true })).toBeVisible();
    await expect(document.getByRole("button", { name: "👋: 1", exact: true })).toHaveAttribute("aria-pressed", "false");
  });
  await runner.checkpoint("spoiler-visible", initial, [], async (document) => {
    await document.getByRole("button", { name: "Reveal spoiler", exact: true }).press("Enter");
    await expect(document.getByRole("button", { name: "Hide spoiler", exact: true })).toBeFocused();
    await expect(document.getByText("the meeting point", { exact: true })).toBeVisible();
  });
  await runner.checkpoint("spoiler-hidden", initial, [], async (document) => {
    await document.getByRole("button", { name: "Hide spoiler", exact: true }).press("Enter");
    await expect(document.getByRole("button", { name: "Reveal spoiler", exact: true })).toBeFocused();
  });
  const reaction: NativeEvent = {
    name: "reaction-toggle",
    args: ["classic", "wave"],
  };
  await runner.checkpoint("reaction-on", { ...initial, reacted: true }, [reaction], async (document) => {
    await document.getByRole("button", { name: "👋: 1", exact: true }).click();
    await expect(document.getByRole("button", { name: "👋: 2", exact: true })).toHaveAttribute("aria-pressed", "true");
  });
  await runner.checkpoint("reaction-off", initial, [reaction, reaction], async (document) => {
    await document.getByRole("button", { name: "👋: 2", exact: true }).click();
    await expect(document.getByRole("button", { name: "👋: 1", exact: true })).toHaveAttribute("aria-pressed", "false");
  });
}
async function interactions(runner: Runner): Promise<void> {
  await runner.checkpoint("initial", initial, [], async (document) => {
    await expect(document.getByRole("combobox", { name: "Choose topics" })).toHaveText("Choose topics");
    await expect(document.getByRole("button", { name: "Unavailable", exact: true })).toBeDisabled();
  });
  await runner.checkpoint("menu-open", initial, [], async (document) => {
    const combo = document.getByRole("combobox", { name: "Choose topics" });
    await combo.press("ArrowDown");
    await expect(combo).toBeFocused();
    await expect(combo).toHaveAttribute("aria-expanded", "true");
    const option = document.getByRole("option", { name: "Maps", exact: true });
    await expect(option).toHaveAttribute("aria-selected", "false");
    const optionId = await option.getAttribute("id");
    expect(optionId).toBeTruthy();
    await expect(combo).toHaveAttribute("aria-activedescendant", optionId!);
  });
  const selected = {
    ...initial,
    selectValues: {
      topics: ["maps"],
    },
  };
  await runner.checkpoint("selected", selected, [selection], async (document) => {
    await document.getByRole("combobox", { name: "Choose topics" }).press("Enter");
    await expect(document.getByRole("option", { name: "Maps", exact: true })).toHaveAttribute("aria-selected", "true");
    await expect(document.getByRole("combobox", { name: "Choose topics" })).toContainText("Maps");
  });
  await runner.checkpoint("menu-closed", selected, [selection], async (document) => {
    const combo = document.getByRole("combobox", { name: "Choose topics" });
    await combo.press("Escape");
    await expect(combo).toBeFocused();
    await expect(combo).toHaveAttribute("aria-expanded", "false");
    await expect(document.getByRole("listbox")).toHaveCount(0);
  });
  await runner.checkpoint("wave", { ...selected, waves: 1 }, [selection, wave], async (document) => {
    await document.getByRole("button", { name: "Wave", exact: true }).click();
  });
}
function history(document: FrameLocator) {
  return document.getByRole("log", { name: "Messages", exact: true }).first();
}
async function channel(runner: Runner): Promise<void> {
  await runner.checkpoint("initial", initial, [], async (document) => {
    await expect(document.getByRole("textbox", { name: "Message #trail", exact: true })).toBeEmpty();
    await expect(document.getByRole("complementary", { name: "Thread : Route planning", exact: true })).toHaveCount(0);
  });
  const events: NativeEvent[] = Array.from({ length: 20 }, (_, index) => ({
    name: "send",
    args: [`Local note ${index + 1}`],
  }));
  const populated = { ...initial, messageCount: 21 };
  await runner.checkpoint("history-full", populated, events, async (document) => {
    const composer = document.getByRole("textbox", { name: "Message #trail", exact: true });
    for (let index = 1; index <= 20; index++) {
      await composer.fill(`Local note ${index}`);
      await composer.press("Enter");
    }
    await expect(document.getByText("Local note 20", { exact: true })).toBeVisible();
    await expect.poll(() => history(document).evaluate(element => element.scrollHeight - element.clientHeight)).toBeGreaterThan(100);
    await expect.poll(() => history(document).evaluate(element => element.scrollHeight - element.clientHeight - element.scrollTop)).toBeLessThan(2);
  });
  const reading = { ...populated, messageCount: 22 };
  const sent = [
    ...events,
    {
      name: "send" as const,
      args: ["While reading history"],
    },
  ];
  await runner.checkpoint("history-preserved", reading, sent, async (document) => {
    await history(document).press("Home");
    await expect.poll(() => history(document).evaluate(element => element.scrollTop)).toBe(0);
    const composer = document.getByRole("textbox", { name: "Message #trail", exact: true });
    await composer.fill("While reading history");
    await composer.press("Enter");
    await expect.poll(() => history(document).evaluate(element => element.scrollTop)).toBe(0);
  });
  const opened = [
    ...sent,
    {
      name: "thread-open" as const,
      args: ["discussion"],
    },
  ];
  await runner.checkpoint("thread-open", { ...reading, activeThreadId: "discussion" }, opened, async (document) => {
    await document.getByRole("button", { name: /Open thread Route planning/ }).press("Enter");
    await expect(document.getByRole("button", { name: "Close thread", exact: true })).toBeFocused();
  });
  const replied = [
    ...opened,
    {
      name: "thread-send" as const,
      args: ["discussion", "Local thread note"],
    },
  ];
  await runner.checkpoint("thread-reply", { ...reading, activeThreadId: "discussion", replyCount: 1 }, replied, async (document) => {
    const composer = document.getByRole("textbox", { name: "Message #Route planning", exact: true });
    await composer.fill("Local thread note");
    await composer.press("Enter");
    await expect(document.getByRole("complementary", { name: "Thread : Route planning", exact: true }).getByText("Local thread note", { exact: true })).toBeVisible();
  });
  await runner.checkpoint("thread-closed", { ...reading, replyCount: 1 }, [
    ...replied,
    { name: "thread-close", args: [] },
  ], async (document) => {
    await document.getByRole("textbox", { name: "Message #Route planning", exact: true }).press("Escape");
    await expect(document.getByRole("complementary", { name: "Thread : Route planning", exact: true })).toHaveCount(0);
    await expect(document.getByRole("button", { name: /Open thread Route planning/ })).toBeFocused();
    await expect.poll(() => history(document).evaluate(element => element.scrollTop)).toBe(0);
  });
}
const journeys = { classic, interactions, channel };
for (const scenario of ["classic", "interactions", "channel"] as const) {
  for (const theme of ["light", "ash", "dark"] as const) {
    for (const width of [390, 1280] as const) {
      test(`${scenario} ${theme} ${width}`, async ({ page }, info) => {
        const runner = createRunner(page, info, { scenario, theme, width });
        try {
          await runner.load();
          for (const framework of frameworks)
            await runner.runFramework(framework, () => journeys[scenario](runner));
        }
        finally { await runner.finish(); }
      });
    }
  }
}
