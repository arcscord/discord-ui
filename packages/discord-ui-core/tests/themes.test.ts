import { expect, it } from "vitest";
import { defineTheme, resolveTheme, themes, themeStyle } from "../src/themes";

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

it("resolves overrides without mutating inherited tokens", () => {
  const parent = defineTheme({
    name: "paper",
    extends: "light",
    tokens: { background: "#fff" },
  });
  const resolved = resolveTheme(parent, { background: "#eee" });
  expect(parent.tokens.background).toBe("#fff");
  expect(resolved.colorScheme).toBe("light");
  expect(themeStyle(resolved.tokens)).toEqual({ "--discord-ui-background": "#eee" });
});
