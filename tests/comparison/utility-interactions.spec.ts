import type { Locator } from "@playwright/test";
import type { NativeEvent } from "../../apps/comparison/src/previews/protocol";
import { expect, test } from "@playwright/test";
import { frameworks } from "../../fixtures/comparison/scenarios";

for (const theme of ["light", "ash", "dark"]) {
  test(`utility callbacks match native target and event contracts in ${theme}`, async ({ page }, testInfo) => {
    const journeys: NativeEvent[][] = [];
    const errors: string[] = [];
    page.on("pageerror", error => errors.push(error.message));
    for (const framework of frameworks) {
      await page.goto(`/previews/${framework}/?scenario=utility-interactions&theme=${theme}`);
      await expect(page.locator("#status")).toHaveText("Loaded — local simulation");
      const observed: NativeEvent[] = [];
      async function activate(target: Locator, name: NativeEvent["name"], id: string, options: { keyboard?: boolean; prevent?: boolean; contextKey?: boolean; activationKey?: "Enter" | "Space" } = {}): Promise<NativeEvent> {
        if (options.contextKey) {
          await target.focus();
          await target.press("Shift+F10");
        }
        else if (options.keyboard) {
          await target.press(options.activationKey ?? "Enter");
        }
        else {
          await target.click({
            button: name.endsWith("context-menu")
              ? "right"
              : "left",
          });
        }
        await expect.poll(async () => (await page.locator("#events").textContent())?.trim().split("\n").filter(Boolean).length).toBe(observed.length + 1);
        const events = (await page.locator("#events").textContent())!.trim().split("\n").filter(Boolean).map(line => (JSON.parse(line) as { event: NativeEvent }).event);
        const current = events.at(-1)!;
        expect(current.name).toBe(name);
        expect(current.args[0]).toMatchObject({ id });
        expect(current.args[1]).toEqual({
          defaultPreventedBefore: false,
          defaultPreventedAfter: options.prevent ?? false,
          button: options.contextKey
            ? expect.any(Number)
            : name.endsWith("context-menu") && !options.keyboard
              ? 2
              : 0,
        });
        observed.push(current);
        return current;
      }
      const messages = page.locator(".dui-message-list .dui-message");
      await expect(messages).toHaveCount(2);
      const classic = messages.nth(0);
      const author = classic.locator(".dui-message-header .dui-author-name");
      const clicked = await activate(author, "user-click", "guide", { keyboard: true });
      expect(clicked.args[0]).toEqual({ id: "guide", displayName: "Field Guide" });
      await expect(author).toBeFocused();
      await activate(classic.locator(".dui-message-avatar .dui-avatar"), "user-click", "guide");
      await activate(classic.locator(".dui-reply-preview .dui-author-name"), "user-click", "guide");
      await activate(author, "user-context-menu", "guide");
      const threadPreview = classic.locator(".dui-thread-preview");
      await expect(threadPreview.locator("button button")).toHaveCount(0);
      await activate(threadPreview.locator(".dui-author-name"), "user-click", "thread-author", { keyboard: true });
      await activate(threadPreview.locator(".dui-avatar"), "user-click", "thread-author");
      await expect(threadPreview.locator(".dui-avatar")).toHaveAttribute("tabindex", "-1");
      await threadPreview.locator("button.dui-thread-open").press("Enter");
      await expect.poll(async () => (await page.locator("#events").textContent())!.trim().split("\n").filter(Boolean).length).toBe(observed.length + 1);
      const opened = JSON.parse((await page.locator("#events").textContent())!.trim().split("\n").at(-1)!) as { event: NativeEvent };
      expect(opened.event).toEqual({
        name: "thread-open",
        args: ["utility-thread"],
      });
      observed.push(opened.event);
      for (const nativeTarget of [
        classic.getByRole("link", { name: "Route guide" }),
        classic.getByRole("combobox"),
      ]) {
        await nativeTarget.focus();
        await nativeTarget.press("Shift+F10");
        await page.keyboard.press("Escape");
        const defaultAllowed = await nativeTarget.evaluate(element => element.dispatchEvent(new MouseEvent("contextmenu", { bubbles: true, cancelable: true, button: 2 })));
        expect(defaultAllowed).toBe(true);
        expect((await page.locator("#events").textContent())!.trim().split("\n").filter(Boolean)).toHaveLength(observed.length);
      }
      const expectedMentions = [
        { id: "123456789012345678", kind: "user" },
        { id: "234567890123456789", kind: "role" },
        { id: "345678901234567890", kind: "channel" },
        { id: "456789012345678901", kind: "command" },
      ];
      for (const group of [
        classic.locator(".dui-message-body > .dui-markdown"),
        classic.locator(".dui-embed"),
        messages.nth(1),
      ]) {
        const mentions = group.locator(".dui-mention");
        await expect(mentions).toHaveCount(4);
        for (const [index, mention] of expectedMentions.entries()) {
          const result = await activate(mentions.nth(index), "mention-click", mention.id, { keyboard: true });
          expect(result.args[0]).toMatchObject(mention);
          await expect(mentions.nth(index)).toBeFocused();
        }
        await activate(mentions.first(), "mention-context-menu", expectedMentions[0].id);
      }
      await activate(classic.locator(".dui-message-header time"), "message-context-menu", "utility-classic");
      await page.getByRole("button", { name: "Update utility targets" }).click();
      await expect(author).toHaveText("Updated Guide");
      await activate(author, "user-click", "guide-updated", { keyboard: true });
      await activate(author, "user-context-menu", "guide-updated", { prevent: true });
      await activate(classic.locator(".dui-mention").first(), "mention-context-menu", expectedMentions[0].id, { prevent: true });
      await activate(classic.locator(".dui-message-header time"), "message-context-menu", "utility-classic", { prevent: true });
      await page.getByRole("button", { name: "Cycle utility handlers" }).click();
      await activate(author, "message-context-menu", "utility-classic", { prevent: true });
      await activate(classic.locator(".dui-mention").first(), "message-context-menu", "utility-classic", { prevent: true });
      await page.getByRole("button", { name: "Cycle utility handlers" }).click();
      const contextAuthor = classic.locator(".dui-message-header .dui-author-name");
      const contextAvatar = classic.locator(".dui-message-avatar .dui-avatar");
      const contextMention = classic.locator(".dui-mention").first();
      for (const [index, target] of [contextAuthor, contextAvatar, contextMention].entries()) {
        await expect(target).toHaveJSProperty("tabIndex", index === 1
          ? -1
          : 0);
        await expect(target).toHaveRole("button");
        await expect(target).toHaveAttribute("aria-haspopup", "menu");
        await target.focus();
        await expect(target).toBeFocused();
        await activate(target, index === 2
          ? "mention-context-menu"
          : "user-context-menu", index === 2
          ? expectedMentions[0].id
          : "guide-updated", {
          keyboard: true,
          activationKey: index === 2
            ? "Space"
            : "Enter",
          prevent: true,
        });
      }
      await activate(contextAuthor, "user-context-menu", "guide-updated", { prevent: true, contextKey: true });
      await activate(contextAvatar, "user-context-menu", "guide-updated", { prevent: true, contextKey: true });
      await activate(contextMention, "mention-context-menu", expectedMentions[0].id, { prevent: true, contextKey: true });
      await activate(classic, "message-context-menu", "utility-classic", { prevent: true, contextKey: true });
      const standalone = page.getByTestId("standalone-utility").locator("article.arcscord-discord-ui.dui-message");
      await standalone.focus();
      await expect(standalone).toBeFocused();
      await expect(standalone).toHaveCSS("outline-style", "solid");
      await expect(standalone).toHaveCSS("outline-width", "2px");
      await activate(standalone, "message-context-menu", "utility-standalone", { contextKey: true, prevent: true });
      expect(await page.evaluate(() => document.documentElement.scrollWidth > innerWidth)).toBe(false);
      await page.screenshot({
        path: testInfo.outputPath(`${framework}-${theme}.png`),
        fullPage: true,
      });
      journeys.push(observed);
    }
    expect(journeys[1]).toEqual(journeys[0]);
    expect(journeys[2]).toEqual(journeys[0]);
    expect(errors).toEqual([]);
  });
}
