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
async function channelList(runner: Runner, french = false): Promise<void> {
  let state: Snapshot = {
    ...initial,
    channelList: { activeChannelId: "general", interactive: true, customIcons: false },
  };
  const events: NativeEvent[] = [];
  const stageName = french ? "stage (Scène)" : "stage (Stage channel)";
  const supportName = french ? "support (Support personnalisé)" : "support (Support channel)";
  const numericName = french ? "numeric (Salon numérique)" : "numeric (Custom numeric channel)";
  await runner.checkpoint("built-in-icons", state, [...events], async (document) => {
    const list = document.getByRole("navigation", { name: "Server channels", exact: true });
    await expect(list.getByRole("button")).toHaveCount(18);
    await expect(list.getByRole("heading", { level: 3 })).toHaveCount(1);
    await expect(list.locator("[aria-current='page']")).toContainText("general");
    await expect(list.locator(".dui-channel-list-badge")).toHaveText("2");
    await expect(list.locator("[data-muted]")).toContainText("voice");
    await expect(list.getByRole("button", { name: stageName, exact: true })).toBeVisible();
    await expect(list.getByRole("button", { name: supportName, exact: true })).toBeVisible();
    await expect(list.getByRole("button", {
      name: french ? "unknown (Salon)" : "unknown (Channel)",
      exact: true,
    })).toBeVisible();
    await expect(list.getByRole("button", { name: "category (Category)", exact: true }).locator("svg path")).toHaveAttribute("d", "m3.3 8.5 7.6 7.6a1.6 1.6 0 0 0 2.2 0l7.6-7.6-2.2-2.2L12 12.8 5.5 6.3l-2.2 2.2Z");
    await expect(list.getByRole("button", {
      name: french ? "media (Média)" : "media (Media channel)",
      exact: true,
    }).locator("svg path")).toHaveAttribute("d", "M4 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H4Zm1 14 5-6 4 4 3-3 3 5H5Zm11-8a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z");
    await expect(list.getByRole("button", { name: "forum (Forum channel)", exact: true }).locator("svg path")).toHaveAttribute("d", "M2 10h5v2H2v-2Zm7 0h6v2H9v-2Zm8 0h5v2h-5v-2Z");
    const stagePath = await list.getByRole("button", { name: stageName, exact: true }).locator("svg path").getAttribute("d");
    const voicePath = await list.locator("[data-muted] svg path").getAttribute("d");
    expect(stagePath).not.toBe(voicePath);
    await expect(list.getByRole("button", { name: stageName, exact: true }).locator("svg")).toHaveAttribute("fill", "currentColor");
    await expect(list.getByRole("button", { name: stageName, exact: true }).locator("svg path")).toHaveAttribute("fill-rule", "evenodd");
    await expect(document.locator(".dui-select-channel-lock")).toHaveCount(4);
    await expect(document.locator("[data-comparison-icon]")).toHaveCount(0);
    expect(await list.evaluate(element => element.scrollWidth > element.clientWidth)).toBe(false);
  });
  state = {
    ...state,
    channelList: { ...state.channelList!, activeChannelId: "stage" },
  };
  events.push({
    name: "channel-click",
    args: ["stage"],
  });
  await runner.checkpoint("keyboard-selection", state, [...events], async (document) => {
    const stage = document.getByRole("button", { name: stageName, exact: true });
    await stage.focus();
    await stage.press("Enter");
    await expect(stage).toHaveAttribute("aria-current", "page");
    await expect(stage).toBeFocused();
  });
  state = {
    ...state,
    channelList: { ...state.channelList!, customIcons: true },
  };
  events.push({
    name: "host-update",
    args: ["channel-icons", true],
  });
  await runner.checkpoint("custom-icons", state, [...events], async (document) => {
    await document.getByRole("button", { name: "Toggle custom icons", exact: true }).click();
    for (const [icon, count] of [
      ["support", 3],
      ["stage", 1],
      ["numeric", 1],
      ["rules", 1],
      ["locked", 4],
    ] as const)
      await expect(document.locator(`[data-comparison-icon="${icon}"]`)).toHaveCount(count);
    await expect(document.getByRole("button", { name: supportName, exact: true })).toBeVisible();
    await expect(document.locator(".dui-select-chip [data-comparison-icon='support']")).toBeVisible();
    await expect(document.locator(".dui-channel-header [data-comparison-icon='support']")).toBeVisible();
  });
  state = {
    ...state,
    channelList: { ...state.channelList!, activeChannelId: "support" },
  };
  events.push({
    name: "channel-click",
    args: ["support"],
  });
  await runner.checkpoint("pointer-selection", state, [...events], async (document) => {
    const support = document.getByRole("button", { name: supportName, exact: true });
    await support.click();
    await expect(support).toHaveAttribute("aria-current", "page");
  });
  state = {
    ...state,
    channelList: { ...state.channelList!, interactive: false },
  };
  events.push({
    name: "host-update",
    args: ["channel-navigation", false],
  });
  await runner.checkpoint("navigation-disabled", state, [...events], async (document) => {
    await document.getByRole("button", { name: "Toggle navigation", exact: true }).click();
    const list = document.getByRole("navigation", { name: "Server channels", exact: true });
    await expect(list.getByRole("button")).toHaveCount(0);
    await expect(list.locator("span.dui-channel-list-item")).toHaveCount(18);
    await expect(list.locator("[aria-current='page']")).toContainText("support");
  });
  state = {
    ...state,
    channelList: { ...state.channelList!, interactive: true },
  };
  events.push({
    name: "host-update",
    args: ["channel-navigation", true],
  });
  await runner.checkpoint("navigation-restored", state, [...events], async (document) => {
    await document.getByRole("button", { name: "Toggle navigation", exact: true }).click();
    await expect(document.getByRole("navigation", { name: "Server channels", exact: true }).getByRole("button")).toHaveCount(18);
  });
  state = {
    ...state,
    channelList: { ...state.channelList!, activeChannelId: "numeric" },
  };
  events.push({
    name: "channel-click",
    args: ["numeric"],
  });
  await runner.checkpoint("space-selection", state, [...events], async (document) => {
    const numeric = document.getByRole("button", { name: numericName, exact: true });
    await numeric.focus();
    await numeric.press("Space");
    await expect(numeric).toHaveAttribute("aria-current", "page");
    await expect(numeric).toBeFocused();
  });
  state = {
    ...state,
    channelList: { ...state.channelList!, customIcons: false },
  };
  events.push({
    name: "host-update",
    args: ["channel-icons", false],
  });
  await runner.checkpoint("default-icons-restored", state, [...events], async (document) => {
    await document.getByRole("button", { name: "Toggle custom icons", exact: true }).click();
    await expect(document.locator("[data-comparison-icon]")).toHaveCount(0);
    await expect(document.getByRole("button", { name: numericName, exact: true })).toHaveAttribute("aria-current", "page");
  });
}
async function classic(runner: Runner): Promise<void> {
  await runner.checkpoint("initial", initial, [], async (document) => {
    await expect(document.getByText("Trail notes", { exact: true })).toBeVisible();
    await expect(document.getByText("Route Bot", { exact: true })).toBeVisible();
    await expect(document.locator(".dui-author-tag", { hasText: "DEMO" })).toBeVisible();
    await expect(document.locator(".dui-author-tag-badge[src=\"/examples/tag-badge.png\"]")).toBeVisible();
    await expect(document.getByText("The original message is unavailable.", { exact: true })).toBeVisible();
    await expect(document.getByText("Only you can see this message.", { exact: true })).toBeVisible();
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
  await runner.checkpoint("ephemeral-dismissed", initial, [
    reaction,
    reaction,
    {
      name: "ephemeral-dismiss",
      args: ["classic-private"],
    },
  ], async (document) => {
    await document.getByRole("button", { name: "Dismiss message", exact: true }).press("Enter");
    await expect(document.getByText("Only you can see this message.", { exact: true })).toHaveCount(0);
  });
}
async function interactions(runner: Runner): Promise<void> {
  await runner.checkpoint("initial", initial, [], async (document) => {
    await expect(document.getByRole("combobox", { name: "Choose topics" })).toHaveText("Choose topics");
    await expect(document.getByText("Explore the route", { exact: true })).toBeVisible();
    await expect(document.getByRole("button", { name: "Details", exact: true })).toBeVisible();
    await expect(document.locator(".dui-container")).toHaveCount(1);
    await expect(document.locator(".dui-separator")).toHaveCount(1);
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
  await runner.checkpoint("section-accessory", { ...selected, waves: 2 }, [
    selection,
    wave,
    {
      name: "button-click",
      args: [
        "section-button",
        { messageId: "poll", componentId: "section-button" },
      ],
    },
  ], async (document) => {
    await document.getByRole("button", { name: "Details", exact: true }).press("Enter");
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
  await runner.checkpoint("composer-empty", initial, [], async (document) => {
    const composer = document.getByRole("textbox", { name: "Message #trail", exact: true });
    await expect(document.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
    await composer.press("Enter");
    await composer.fill("   ");
    await composer.press("Enter");
    await expect(document.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
    await composer.fill("");
  });
  await runner.checkpoint("composer-newline", initial, [], async (document) => {
    const composer = document.getByRole("textbox", { name: "Message #trail", exact: true });
    await composer.fill("First line");
    await composer.press("End");
    await composer.press("Shift+Enter");
    await composer.press("a");
    await expect(composer).toHaveValue("First line\na");
    await composer.fill("");
  });
  await runner.checkpoint("composer-composition", initial, [], async (document) => {
    const composer = document.getByRole("textbox", { name: "Message #trail", exact: true });
    await composer.fill("Composing text");
    // Playwright cannot drive a platform IME. Exercise its native keyboard event guard.
    await composer.dispatchEvent("keydown", { key: "Enter", code: "Enter", isComposing: true });
    await expect(composer).toHaveValue("Composing text");
    await composer.fill("");
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
async function markdown(runner: Runner): Promise<void> {
  await runner.checkpoint("formatted", initial, [], async (document) => {
    await expect(document.getByText("nested italic", { exact: true })).toBeVisible();
    await expect(document.locator("blockquote")).toContainText("A quoted trail");
    await expect(document.getByRole("listitem")).toHaveText(["First stop", "Second stop"]);
    await expect(document.locator("code").first()).toHaveText("inline code");
    await expect(document.locator(".dui-code-block")).toContainText("const route = 12;");
    await expect(document.locator(".dui-code-block span").first()).toBeVisible();
    await expect(document.getByRole("link", { name: "map", exact: true })).toHaveAttribute("href", "https://example.com/map");
    await expect(document.locator("time").last()).toBeVisible();
    await expect(document.locator(".dui-mention")).toHaveText("@Ari");
  });
}
async function embeds(runner: Runner, width = 390): Promise<void> {
  await runner.checkpoint("fields-and-wrapping", initial, [], async (document) => {
    await expect(document.getByText("Route details", { exact: true })).toBeVisible();
    await expect(document.getByText("Distance", { exact: true })).toBeVisible();
    await expect(document.getByText("12 kilometers", { exact: true })).toBeVisible();
    await expect(document.getByText("Terrain", { exact: true })).toBeVisible();
    await expect(document.getByText("A long description that wraps naturally across narrower previews.", { exact: true })).toBeVisible();
    const thumbnail = document.getByRole("img", { name: "Route thumbnail", exact: true });
    await expect(thumbnail).toBeVisible();
    expect(await thumbnail.evaluate(element => element.getBoundingClientRect().width)).toBe(width <= 480
      ? 52
      : 88);
    const fields = await document.locator(".dui-embed-field-inline").evaluateAll(elements => elements.map(element => element.getBoundingClientRect().top));
    expect(fields).toHaveLength(2);
    if (width <= 480)
      expect(fields[1]).toBeGreaterThan(fields[0]!);
    expect(await document.locator("#capture").evaluate(element => element.scrollWidth <= element.clientWidth)).toBe(true);
  });
}
async function media(runner: Runner): Promise<void> {
  await runner.checkpoint("media-policy", initial, [], async (document) => {
    await expect(document.getByText("Media and files", { exact: true })).toBeVisible();
    await expect(document.locator(".dui-message[data-mentioned=true]")).toHaveCount(1);
    await expect(document.locator(".dui-ephemeral-notice, .dui-ephemeral-dismiss")).toHaveCount(0);
    await expect(document.getByRole("img", { name: "Local image", exact: true })).toBeVisible();
    await expect(document.getByRole("img", { name: "Allowlisted image", exact: true })).toBeVisible();
    await expect(document.getByRole("img", { name: "Media unavailable: Missing image", exact: true })).toBeVisible();
    await expect(document.locator("img[src=\"https://example.com/blocked.png\"]")).toHaveCount(0);
    await expect(document.getByRole("img", { name: "Media unavailable: Remote image", exact: true })).toBeVisible();
    await expect(document.getByText("route.txt", { exact: true })).toBeVisible();
    await expect(document.getByText("2 KB", { exact: true })).toBeVisible();
    await expect(document.locator("video")).toHaveCount(1);
    await expect(document.locator("audio")).toHaveCount(2);
    await expect(document.locator("video")).toHaveAttribute("preload", "none");
    await expect(document.locator("video")).toHaveAttribute("poster", "/examples/trail-poster.png");
    await expect(document.locator(".dui-player-video")).toHaveAttribute("data-started", "false");
    await expect(document.locator(".dui-player-video .dui-player-controls")).toBeHidden();
    await expect(document.locator(".dui-player-voice .dui-player-download")).toHaveCount(0);
    await expect(document.locator("audio").first()).toHaveAttribute("preload", "none");
    await expect(document.locator(".dui-player-voice .dui-player-timeline .dui-waveform")).toBeVisible();
    await expect(document.locator(".dui-player-voice .dui-player-title")).toHaveCount(0);
    await expect(document.locator(".dui-player-file-icon")).toBeVisible();
    await expect(document.locator(".dui-player-volume-control[data-open=true]")).toHaveCount(0);
    await expect(document.getByRole("img", { name: "Arcscord sticker", exact: true })).toBeVisible();
    await expect(document.getByRole("img", { name: "APNG marker", exact: true })).toBeVisible();
    await expect(document.getByRole("img", { name: "GIF marker", exact: true })).toBeVisible();
    await expect(document.getByText(/Sticker format not supported/)).toBeVisible();
  });
  await runner.checkpoint("media-audio", initial, [], async (document) => {
    await document.locator(".dui-player-voice").evaluate(element => element.scrollIntoView({ block: "center", inline: "nearest" }));
    await expect(document.locator(".dui-player-voice .dui-player-timeline .dui-waveform")).toBeVisible();
    await expect(document.locator(".dui-player-voice .dui-player-title")).toHaveCount(0);
    await expect(document.locator(".dui-player-file-icon")).toBeVisible();
    await expect(document.locator(".dui-player-volume-control[data-open=true]")).toHaveCount(0);
    await expect(document.locator(".dui-player-voice").getByRole("button", { name: "Playback speed", exact: true })).toHaveText("1X");
  });
  await runner.checkpoint("media-stickers", initial, [], async (document) => {
    await document.locator(".dui-sticker").last().evaluate(element => element.scrollIntoView({ block: "center", inline: "nearest" }));
    await expect(document.getByText(/Sticker format not supported/)).toBeVisible();
  });
}

async function spoilers(runner: Runner, french = false): Promise<void> {
  const reveal = french ? "Révéler le spoiler" : "Reveal spoiler";
  const hide = french ? "Masquer le spoiler" : "Hide spoiler";
  await runner.checkpoint("hidden", initial, [], async (document) => {
    await expect(document.getByRole("button", { name: reveal, exact: true })).toHaveCount(2);
  });
  await runner.checkpoint("pointer-reveal", initial, [], async (document) => {
    await document.getByRole("button", { name: reveal, exact: true }).first().click();
    await expect(document.getByRole("button", { name: hide, exact: true })).toBeFocused();
    await expect(document.getByText("the meeting point", { exact: true })).toBeVisible();
  });
  await runner.checkpoint("keyboard-hide", initial, [], async (document) => {
    await document.getByRole("button", { name: hide, exact: true }).press("Enter");
    await expect(document.getByRole("button", { name: reveal, exact: true }).first()).toBeFocused();
  });
  await runner.checkpoint("keyboard-reveal", initial, [], async (document) => {
    await document.getByRole("button", { name: reveal, exact: true }).last().press("Space");
    await expect(document.getByRole("button", { name: hide, exact: true })).toBeFocused();
    await expect(document.getByText("the hidden route", { exact: true })).toBeVisible();
  });
}
async function buttons(runner: Runner): Promise<void> {
  await runner.checkpoint("variants", initial, [], async (document) => {
    await expect(document.getByRole("button", { name: "Unavailable", exact: true })).toBeDisabled();
    await expect(document.getByRole("link", { name: "Open map", exact: true })).toHaveAttribute("href", "https://example.com/map");
  });
  const action: NativeEvent = {
    name: "button-click",
    args: [
      "action",
      { messageId: "buttons", componentId: "action" },
    ],
  };
  await runner.checkpoint("action-context", { ...initial, waves: 1 }, [action], async (document) => {
    await document.getByRole("button", { name: "Take action", exact: true }).press("Enter");
  });
  await runner.checkpoint("premium-context", { ...initial, waves: 1 }, [
    action,
    {
      name: "premium-click",
      args: [
        "sku-1",
        { messageId: "buttons", componentId: "premium" },
      ],
    },
  ], async (document) => {
    await document.getByRole("button", { name: "◆ Upgrade", exact: true }).click();
  });
}
async function selects(runner: Runner): Promise<void> {
  const events: NativeEvent[] = [];
  const values: Record<string, string[]> = { topics: [] };
  for (const [id, placeholder, label, value] of [
    [
      "string",
      "Choose trail",
      "Maps",
      "maps",
    ],
    ["user", "Choose user", "Ari", "user-1"],
    [
      "role",
      "Choose role",
      "Guides",
      "role-1",
    ],
    [
      "mention",
      "Choose mention",
      "Ari",
      "user-1",
    ],
    [
      "channel",
      "Choose channel",
      "routes",
      "channel-1",
    ],
  ]) {
    await runner.checkpoint(`${id}-open`, {
      ...initial,
      selectValues: { ...values },
    }, [...events], async (document) => {
      const combo = document.getByRole("combobox", { name: placeholder, exact: true });
      await combo.press("ArrowDown");
      await expect(combo).toHaveAttribute("aria-expanded", "true");
      await expect(document.getByRole("option", { name: label, exact: true })).toBeVisible();
      if (id === "user") {
        await combo.fill("No matching person");
        await expect(document.getByRole("option")).toHaveCount(0);
        await combo.fill("Ar");
        await expect(document.getByRole("option", { name: "Ari", exact: true })).toBeVisible();
        await combo.press("ArrowDown");
      }
    });
    values[id!] = [value!];
    events.push({
      name: "select-change",
      args: [
        id,
        [value],
        { messageId: "selects", componentId: id },
      ],
    });
    await runner.checkpoint(`${id}-selected`, {
      ...initial,
      selectValues: { ...values },
    }, [...events], async (document) => {
      const combo = document.getByRole("combobox", { name: placeholder, exact: true });
      await combo.press("Enter");
      if (id === "string") {
        await expect(combo).toContainText(label!);
      }
      else {
        await expect(document.locator(`.dui-select[data-kind="${id === "mention"
          ? "mentionable"
          : id}-select"] .dui-select-chip`)).toContainText(label!);
      }
      await combo.press("Escape");
      await expect(combo).toBeFocused();
      await expect(combo).toHaveAttribute("aria-expanded", "false");
    });
  }
  values.string = ["maps", "gear"];
  events.push({
    name: "select-change",
    args: [
      "string",
      ["maps", "gear"],
      { messageId: "selects", componentId: "string" },
    ],
  });
  await runner.checkpoint("selection-maximum", {
    ...initial,
    selectValues: { ...values },
  }, [...events], async (document) => {
    const combo = document.getByRole("combobox", { name: "Choose trail", exact: true });
    await combo.press("ArrowDown");
    await document.getByRole("option", { name: "Gear", exact: true }).click();
    await expect(document.getByRole("option", { name: "Water", exact: true })).toHaveAttribute("aria-disabled", "true");
    await document.getByRole("option", { name: "Water", exact: true }).click({ force: true });
    await expect(combo).toContainText("Maps");
    await expect(combo).toContainText("Gear");
    await combo.press("Escape");
    await expect(document.getByRole("button", { name: "Remove Ari", exact: true }).first()).toBeDisabled();
  });
  events.push({
    name: "host-update",
    args: ["selects", true],
  });
  await runner.checkpoint("disabled-update", {
    ...initial,
    selectValues: { ...values },
  }, [...events], async (document) => {
    await document.getByRole("combobox", { name: "Choose trail", exact: true }).press("ArrowDown");
    await document.getByRole("button", { name: "Disable selects", exact: true }).click();
    for (const placeholder of [
      "Choose trail",
      "Choose user",
      "Choose role",
      "Choose mention",
      "Choose channel",
    ]) {
      const combo = document.getByRole("combobox", { name: placeholder, exact: true });
      await expect(combo).toBeDisabled();
      await expect(combo).toHaveAttribute("aria-expanded", "false");
    }
    await expect(document.getByRole("listbox")).toHaveCount(0);
  });
}
async function reactions(runner: Runner): Promise<void> {
  const event: NativeEvent = {
    name: "reaction-toggle",
    args: ["reactions", "wave"],
  };
  await runner.checkpoint("off", initial, [], async (document) => {
    await expect(document.getByRole("button", { name: "👋: 1", exact: true })).toHaveAttribute("aria-pressed", "false");
  });
  await runner.checkpoint("on", { ...initial, reacted: true }, [event], async (document) => {
    await document.getByRole("button", { name: "👋: 1", exact: true }).press("Space");
    await expect(document.getByRole("button", { name: "👋: 2", exact: true })).toHaveAttribute("aria-pressed", "true");
  });
  await runner.checkpoint("off-again", initial, [event, event], async (document) => {
    await document.getByRole("button", { name: "👋: 2", exact: true }).press("Enter");
    await expect(document.getByRole("button", { name: "👋: 1", exact: true })).toHaveAttribute("aria-pressed", "false");
  });
  await runner.checkpoint("host-update", { ...initial, reacted: true }, [
    event,
    event,
    {
      name: "host-update",
      args: ["reaction", true],
    },
  ], async (document) => {
    await document.getByRole("button", { name: "Update reactions", exact: true }).click();
    await expect(document.getByRole("button", { name: "👋: 2", exact: true })).toHaveAttribute("aria-pressed", "true");
  });
}

async function ownership(runner: Runner): Promise<void> {
  await runner.checkpoint("default", initial, [], async (document) => {
    await expect(document.getByRole("combobox", { name: "Choose ownership", exact: true })).toHaveText("Maps");
  });
  const selected: NativeEvent = {
    name: "select-change",
    args: [
      "ownership",
      ["maps", "gear"],
      { messageId: "selection-ownership", componentId: "ownership" },
    ],
  };
  await runner.checkpoint("local-selection", {
    ...initial,
    selectValues: {
      topics: [],
      ownership: ["maps", "gear"],
    },
  }, [selected], async (document) => {
    const combo = document.getByRole("combobox", { name: "Choose ownership", exact: true });
    await combo.press("ArrowDown");
    await document.getByRole("option", { name: "Gear", exact: true }).click();
    await combo.press("Escape");
    await expect(combo).toHaveText("Maps, Gear");
  });
  const events: NativeEvent[] = [selected];
  for (const [mode, label, values] of [
    ["empty", "Choose ownership", []],
    [
      "external",
      "Gear",
      ["gear"],
    ],
    ["defaults", "Maps, Gear", undefined],
    ["identity", "Maps", undefined],
  ] as const) {
    events.push({
      name: "host-update",
      args: [mode],
    });
    const expected = values === undefined
      ? initial
      : {
          ...initial,
          selectValues: {
            topics: [],
            ownership: [...values],
          },
        };
    await runner.checkpoint(mode, expected, [...events], async (document) => {
      await document.getByRole("button", { name: `Ownership ${mode}`, exact: true }).click();
      await expect(document.getByRole("combobox", { name: "Choose ownership", exact: true })).toHaveText(label);
    });
  }
}
async function threadsCommands(runner: Runner, width = 390): Promise<void> {
  await runner.checkpoint("thread-open", { ...initial, activeThreadId: "discussion" }, [
    {
      name: "thread-open",
      args: ["discussion"],
    },
  ], async (document) => {
    await document.getByRole("button", { name: /Open thread Route planning/ }).press("Enter");
    await expect(document.getByRole("button", { name: "Close thread", exact: true })).toBeFocused();
    if (width <= 640)
      await expect(document.locator(".dui-channel-main")).toBeHidden();
    else
      await expect(document.locator(".dui-channel-main")).toBeVisible();
  });
  const closed: NativeEvent[] = [
    {
      name: "thread-open",
      args: ["discussion"],
    },
    { name: "thread-close", args: [] },
  ];
  await runner.checkpoint("focus-return", initial, closed, async (document) => {
    await document.getByRole("button", { name: "Close thread", exact: true }).press("Escape");
    await expect(document.getByRole("button", { name: /Open thread Route planning/ })).toBeFocused();
  });
  await runner.checkpoint("command-list", initial, closed, async (document) => {
    await document.getByRole("textbox", { name: "Message #trail", exact: true }).fill("/rou");
    await expect(document.getByRole("option", { name: /route.*Plan a route/ })).toBeVisible();
  });
  await runner.checkpoint("command-arguments", initial, closed, async (document) => {
    await document.getByRole("textbox", { name: "Message #trail", exact: true }).press("Enter");
    await expect(document.getByRole("button", { name: "Options", exact: true })).toBeFocused();
    await expect(document.getByRole("button", { name: "Send message", exact: true })).toBeDisabled();
    await document.getByRole("option", { name: /destination.*Destination/ }).click();
    await expect(document.getByRole("textbox", { name: "destination", exact: true })).toBeFocused();
    await document.getByRole("button", { name: "Remove argument", exact: true }).click();
    await expect(document.getByRole("textbox", { name: "destination", exact: true })).toHaveCount(0);
    await document.getByRole("option", { name: /destination.*Destination/ }).click();
    await document.getByRole("textbox", { name: "destination", exact: true }).fill("Summit");
    await document.getByRole("button", { name: "Options", exact: true }).click();
    const pace = document.getByRole("combobox", { name: "pace", exact: true });
    await expect(document.getByRole("textbox", { name: "destination", exact: true })).toHaveAccessibleDescription("Destination");
    await expect(pace).toHaveAccessibleDescription("Walking pace");
    await pace.fill("Fa");
    await expect(document.getByRole("option", { name: "Easy", exact: true })).toHaveCount(0);
    await expect(document.getByRole("option", { name: "Fast", exact: true })).toBeVisible();
    await pace.press("Enter");
    await expect(pace).toHaveValue("Fast");
  });
  const command: NativeEvent = {
    name: "slash-command",
    args: [
      {
        command: {
          name: "route",
          description: "Plan a route",
          arguments: [
            { name: "destination", description: "Destination", required: true },
            {
              name: "pace",
              description: "Walking pace",
              choices: [
                { name: "Easy", value: "easy" },
                { name: "Fast", value: "fast" },
              ],
            },
          ],
        },
        arguments: { destination: "Summit", pace: "fast" },
      },
    ],
  };
  await runner.checkpoint("command-submit", initial, [...closed, command], async (document) => {
    await document.getByRole("button", { name: "Send message", exact: true }).click();
    const composer = document.getByRole("textbox", { name: "Message #trail", exact: true });
    await expect(composer).toBeFocused();
    await expect(composer).toBeEmpty();
    await expect(document.getByRole("textbox", { name: "destination", exact: true })).toHaveCount(0);
  });
}

const journeys = {
  "channel-list": channelList,
  classic,
  interactions,
  channel,
  markdown,
  embeds,
  media,
  spoilers,
  buttons,
  selects,
  "selection-ownership": ownership,
  reactions,
  "threads-commands": threadsCommands,
};

function registerCase(matrix: Parameters<typeof createRunner>[2] & { scenario: keyof typeof journeys }): void {
  test(`${matrix.scenario} ${matrix.theme} ${matrix.width}${matrix.locale
    ? ` ${matrix.locale}`
    : ""}${matrix.customTheme ? " custom" : ""}`, async ({ page }, info) => {
    const runner = createRunner(page, info, matrix);
    try {
      await runner.load();
      for (const framework of frameworks) {
        await runner.runFramework(framework, () => {
          if (matrix.scenario === "threads-commands")
            return threadsCommands(runner, matrix.width);
          if (matrix.scenario === "channel-list")
            return channelList(runner, matrix.locale === "fr-FR");
          if (matrix.scenario === "embeds")
            return embeds(runner, matrix.width);
          if (matrix.scenario === "spoilers")
            return spoilers(runner, matrix.locale === "fr-FR");
          return journeys[matrix.scenario](runner);
        });
      }
    }
    finally { await runner.finish(); }
  });
}
for (const scenario of Object.keys(journeys) as (keyof typeof journeys)[]) {
  for (const theme of ["light", "ash", "dark"] as const) {
    for (const width of [390, 1280])
      registerCase({ scenario, theme, width });
  }
}
for (const width of [480, 481])
  registerCase({ scenario: "embeds", theme: "ash", width });
for (const width of [640, 641])
  registerCase({ scenario: "threads-commands", theme: "ash", width });
registerCase({
  scenario: "spoilers",
  theme: "light",
  width: 390,
  locale: "fr-FR",
});
registerCase({
  scenario: "channel-list",
  theme: "ash",
  width: 390,
  locale: "fr-FR",
});
registerCase({
  scenario: "interactions",
  theme: "dark",
  width: 1280,
  customTheme: true,
});
