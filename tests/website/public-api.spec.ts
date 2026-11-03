import type { Page } from "@playwright/test";
import { expect, test } from "@playwright/test";

async function preview(page: Page, source: string) {
  await page.goto("/playground?example=message");
  await page.getByRole("textbox", { name: "React JSX editor" }).fill(source);
  await expect(page.locator(".live-panel")).toContainText("API regression");
  await expect(page.getByRole("alert")).toHaveCount(0);
  return page.locator(".live-panel");
}

const imports = `import React, { useState } from "react";
import { ChannelView, DiscordUI, MessageComponents, SelectMenu, ThreadPanel } from "@arcscord/discord-ui";
import "@arcscord/discord-ui/styles.css";
const author = { id: "user", displayName: "User" };
const timestamp = "2026-11-03T12:00:00Z";`;

for (const theme of ["light", "ash", "dark"]) {
  test(`conversation identities and controlled threads in ${theme}`, async ({ page }) => {
    const panel = await preview(page, `${imports}
export default function Preview() {
 const [id, setId] = useState("a");
 const [activeThreadId, setActive] = useState(null);
 const message = { id: "starter", author, timestamp, body: { kind: "text", content: "Parent" }, thread: { id: "thread", name: "Discussion", messageCount: 0 } };
 const thread = { id: "thread", name: "Discussion", parentMessageId: "starter", messages: [] };
 return <DiscordUI theme="${theme}"><p>API regression</p>
 <button onClick={() => setId("b")}>Change conversation</button>
 <button onClick={() => setActive("thread")}>Open externally</button>
 <ChannelView channel={{ id, name: id, messages: [message], threads: [thread] }} onSend={() => {}} activeThreadId={activeThreadId} onThreadOpen={setActive} onThreadClose={() => setActive(null)} />
 <div data-testid="standalone"><ThreadPanel thread={{ ...thread, id, name: "standalone-" + id }} onSend={() => {}} /></div>
 </DiscordUI>;
}`);
    await panel.getByRole("textbox", { name: "Message #a", exact: true }).fill("Draft in A");
    await panel.getByRole("textbox", { name: "Message #standalone-a", exact: true }).fill("Thread draft in A");
    await panel.getByRole("button", { name: "Change conversation" }).click();
    await expect(panel.getByRole("textbox", { name: "Message #b", exact: true })).toHaveValue("");
    await expect(panel.getByRole("textbox", { name: "Message #standalone-b", exact: true })).toHaveValue("");
    await panel.getByRole("button", { name: "Open externally" }).click();
    const discussion = panel.getByRole("complementary", { name: "Thread : Discussion", exact: true });
    await expect(discussion).toBeVisible();
    await discussion.getByRole("button", { name: "Close thread" }).click();
    await expect(discussion).toHaveCount(0);
    const opener = panel.getByRole("button", { name: "Open thread Discussion, 0 messages" });
    await opener.click();
    await discussion.getByRole("button", { name: "Close thread" }).press("Escape");
    await expect(discussion).toHaveCount(0);
    await expect(opener).toBeFocused();
  });
}

test("menus reset by identity and never emit removed option IDs", async ({ page }) => {
  const panel = await preview(page, `${imports}
export default function Preview() {
 const [id, setId] = useState("one");
 const [removed, setRemoved] = useState(false);
 const [last, setLast] = useState([]);
 const options = [{ value: "a", label: "Alpha", default: id === "one" }, { value: "b", label: "Beta", default: id === "two" }, { value: "c", label: "Gamma" }];
 return <DiscordUI><p>API regression</p>
 <button onClick={() => setId("two")}>Change menu</button>
 <button onClick={() => setRemoved(!removed)}>Toggle Alpha</button>
 <SelectMenu menu={{ id, kind: "string-select", placeholder: "Choices", minValues: 0, maxValues: 2, options: removed ? options.slice(1) : options }} onChange={setLast} />
 <output aria-label="Last values">{JSON.stringify(last)}</output>
 </DiscordUI>;
}`);
  const menu = panel.getByRole("combobox", { name: "Choices" });
  await expect(menu).toHaveText("Alpha");
  await panel.getByRole("button", { name: "Toggle Alpha" }).click();
  await expect(menu).toHaveText("Choices");
  await menu.click();
  await panel.getByRole("option", { name: "Gamma", exact: true }).click();
  await expect(panel.getByRole("status", { name: "Last values" })).toHaveText("[\"c\"]");
  await menu.press("Escape");
  await panel.getByRole("button", { name: "Toggle Alpha" }).click();
  await expect(menu).toHaveText("Gamma");
  await panel.getByRole("button", { name: "Change menu" }).click();
  await expect(menu).toHaveText("Beta");
});

test("controlled selections and interaction context survive every conversation layer", async ({ page }) => {
  const panel = await preview(page, `${imports}
const rows = [{ id: "row", kind: "action-row", select: { id: "pick", kind: "string-select", placeholder: "Pick", options: [{ value: "a", label: "Alpha" }, { value: "b", label: "Beta" }] } }, { id: "buttons", kind: "action-row", buttons: [{ id: "action", kind: "button", label: "Action" }, { id: "premium", kind: "premium-button", skuId: "sku", label: "Buy" }] }];
export default function Preview() {
 const [values, setValues] = useState({ one: { pick: ["a"] }, two: { pick: ["b"] }, reply: { pick: ["a"] } });
 const [last, setLast] = useState(null);
 const one = { id: "one", author, timestamp, body: { kind: "components-v2", components: rows }, thread: { id: "thread", name: "Discussion", messageCount: 1 } };
 const two = { id: "two", author, timestamp, body: { kind: "text", content: "Classic" }, components: rows };
 const reply = { ...two, id: "reply" };
 return <DiscordUI><p>API regression</p>
 <button onClick={() => setValues({ ...values, one: { pick: ["b"] } })}>Select externally</button>
 <ChannelView channel={{ id: "channel", name: "general", messages: [one, two], threads: [{ id: "thread", name: "Discussion", parentMessageId: "one", messages: [reply] }] }} activeThreadId="thread" selectValuesByMessage={values} onSelectChange={(id, values, context) => setLast({ id, values, ...context })} onButtonClick={(id, context) => setLast({ id, ...context })} onPremiumClick={(skuId, context) => setLast({ skuId, ...context })} />
 <output aria-label="Interaction">{JSON.stringify(last)}</output>
 </DiscordUI>;
}`);
  // At narrow widths the thread replaces the main channel; widen only this flow
  // so both copies of the same select IDs are actionable simultaneously.
  await page.setViewportSize({ width: 1536, height: 1024 });
  await page.getByRole("slider", { name: "Width", exact: true }).fill("1000");
  const main = panel.locator(".dui-channel-main .dui-message");
  const oneMenu = main.nth(0).getByRole("combobox", { name: "Pick" });
  await expect(oneMenu).toHaveText("Alpha");
  await expect(main.nth(1).getByRole("combobox", { name: "Pick" })).toHaveText("Beta");
  await oneMenu.click();
  await panel.getByRole("option", { name: "Beta", exact: true }).click();
  await expect(oneMenu).toHaveText("Alpha");
  const interaction = panel.getByRole("status", { name: "Interaction" });
  await expect(interaction).toHaveText("{\"id\":\"pick\",\"values\":[\"b\"],\"componentId\":\"pick\",\"messageId\":\"one\"}");
  await panel.getByRole("button", { name: "Select externally" }).click();
  await expect(oneMenu).toHaveText("Beta");
  await main.nth(1).getByRole("button", { name: "Action", exact: true }).click();
  await expect(interaction).toHaveText("{\"id\":\"action\",\"componentId\":\"action\",\"messageId\":\"two\"}");
  const reply = panel.locator(".dui-thread-panel .dui-message").nth(1);
  await expect(reply.getByRole("combobox", { name: "Pick" })).toHaveText("Alpha");
  await reply.getByRole("button", { name: "◆ Buy", exact: true }).click();
  await expect(interaction).toHaveText("{\"skuId\":\"sku\",\"componentId\":\"premium\",\"messageId\":\"reply\"}");
});

test("select media policy, image failure and translations apply to chips and options", async ({ page }) => {
  const remoteRequests: string[] = [];
  await page.route("https://example.com/avatar.png", (route) => {
    remoteRequests.push(route.request().url());
    return route.abort();
  });
  const panel = await preview(page, `${imports}
export default function Preview() {
 const [remote, setRemote] = useState(false);
 const user = { id: "user", displayName: "User", entityType: "user", status: "online", avatarUrl: remote ? "/missing-avatar-for-test.png" : "https://example.com/avatar.png" };
 return <DiscordUI allowRemoteMedia={false} labels={{ selectPlaceholder: "Choisir", channelSelectPlaceholder: "Choisir un salon", removeSelection: "Retirer {name}", selectNoResults: "Aucun résultat", selectNoOptions: "Aucune option", userOnline: "En ligne" }}><p>API regression</p>
 <button onClick={() => setRemote(true)}>Use broken local avatar</button>
 <SelectMenu menu={{ id: "users", kind: "user-select", minValues: 0, entities: [user], defaultValues: [{ id: "user", type: "user" }] }} />
 <SelectMenu menu={{ id: "channels", kind: "channel-select", entities: [] }} />
 </DiscordUI>;
}`);
  await expect(panel.getByRole("button", { name: "Retirer User" })).toBeVisible();
  const menu = panel.getByRole("combobox", { name: "Choisir", exact: true });
  await menu.click();
  await expect(panel.getByLabel("En ligne", { exact: true })).toBeVisible();
  await expect(panel.locator("img[src=\"https://example.com/avatar.png\"]")).toHaveCount(0);
  expect(remoteRequests).toEqual([]);
  await menu.fill("nobody");
  await expect(panel.getByRole("note")).toHaveText("Aucun résultat");
  await menu.press("Escape");
  await panel.getByRole("combobox", { name: "Choisir un salon" }).click();
  await expect(panel.getByRole("note")).toHaveText("Aucune option");
  await panel.getByRole("combobox", { name: "Choisir un salon" }).press("Escape");
  await panel.getByRole("button", { name: "Use broken local avatar" }).click();
  await expect(panel.locator(".dui-select-chip .dui-select-avatar")).toHaveText("U");
  await expect(panel.locator(".dui-select-chip .dui-select-avatar img")).toHaveCount(0);
});
