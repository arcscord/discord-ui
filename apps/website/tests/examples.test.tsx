import * as components from "@arcscord/discord-ui";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { generateElement } from "react-live";
import { describe, expect, it } from "vitest";
import { exportCode } from "../src/components/playground/export-code";
import { compileModule, moduleScope } from "../src/components/playground/module-runtime";
import { componentExamples } from "../src/data/component-examples";

describe("curated component examples", () => {
  it("covers every public React component", () => {
    const publicComponents = Object.entries(components).filter(([name, value]) => typeof value === "function" && name !== "defineTheme").map(([name]) => name).sort();
    expect(Array.from(new Set(componentExamples.map(example => example.component ?? example.title))).sort()).toEqual(publicComponents);
    expect(new Set(componentExamples.map(example => example.id)).size).toBe(componentExamples.length);
  });

  for (const example of componentExamples) {
    it(`compiles and renders ${example.title} using the real public API`, () => {
      const errors: Error[] = [];
      const Element = generateElement({
        code: compileModule(exportCode(example.code, "dark")),
        scope: moduleScope,
        enableTypeScript: false,
      }, error => errors.push(error));
      const html = renderToStaticMarkup(createElement(components.DiscordUI, null, createElement(Element)));
      expect(errors).toEqual([]);
      expect(html).toContain("dui-");
    });
  }

  it("does not inject undeclared message data", () => {
    const code = `import React from "react";
import { MessageList } from "@arcscord/discord-ui";
export default function Preview() {
  return <MessageList messages={initialChannel.messages} />;
}`;
    const Element = generateElement({
      code: compileModule(code),
      scope: moduleScope,
      enableTypeScript: false,
    }, () => {});
    expect(() => renderToStaticMarkup(createElement(Element))).toThrow("initialChannel is not defined");
  });

  it("resolves named import aliases and reports unsupported imports", () => {
    const code = `import React from "react";
import { MessageContent as Text } from "@arcscord/discord-ui";
export default function Preview() { return <Text content="Explicit imports" />; }`;
    const Element = generateElement({
      code: compileModule(code),
      scope: moduleScope,
      enableTypeScript: false,
    }, () => {});
    expect(renderToStaticMarkup(createElement(Element))).toContain("Explicit imports");
    expect(() => generateElement({
      code: compileModule("import Unknown from \"unknown-package\"; export default Unknown;"),
      scope: moduleScope,
      enableTypeScript: false,
    }, () => {})).toThrow("Unsupported import");
  });

  it("exports a complete React module with the current theme and referenced data", () => {
    const code = exportCode("() => <Message message={welcome} />", "light");
    expect(code).toContain("import { DiscordUI, Message } from \"@arcscord/discord-ui\"");
    expect(code).toContain("const welcome =");
    expect(code).not.toContain("const initialChannel =");
    expect(code).toContain("const previewTheme = \"light\"");
    expect(code).toContain("import \"@arcscord/discord-ui/styles.css\"");
  });
});
