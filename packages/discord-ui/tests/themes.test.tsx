import { renderToStaticMarkup } from "react-dom/server";
import { expect, it } from "vitest";
import { defineTheme, DiscordUI, themes } from "../src/index";
import { resolveTheme, themeStyle } from "../src/themes";

it("extends presets and custom themes without mutating their tokens", () => {
  const custom = defineTheme({
    name: "brand",
    extends: "ash",
    tokens: { background: "#123456" },
  });
  const derived = defineTheme({
    name: "brand-next",
    extends: custom,
    tokens: { codeBackground: "#654321" },
  });
  expect(derived.base).toBe("ash");
  expect(derived.colorScheme).toBe("dark");
  expect(derived.tokens).toEqual({ background: "#123456", codeBackground: "#654321" });
  expect(custom.tokens).toEqual({ background: "#123456" });
  expect(themes.ash.tokens).toEqual({});
});

it("resolves per-scope overrides and emits typed CSS variables", () => {
  const custom = defineTheme({
    name: "paper",
    extends: "light",
    tokens: { codeBackground: "#112233" },
  });
  const resolved = resolveTheme(custom, { codeBackground: "#445566", quoteBorder: "#778899" });
  expect(themeStyle(resolved.tokens)).toEqual({ "--discord-ui-code-background": "#445566", "--discord-ui-quote-border": "#778899" });
  expect(custom.tokens.codeBackground).toBe("#112233");
  const html = renderToStaticMarkup(<DiscordUI theme={custom} tokens={{ background: "#abcdef" }}>Example</DiscordUI>);
  expect(html).toContain("data-theme=\"paper\"");
  expect(html).toContain("data-base-theme=\"light\"");
  expect(html).toContain("data-color-scheme=\"light\"");
  expect(html).toContain("--discord-ui-background:#abcdef");
});
