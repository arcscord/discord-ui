import antfu from "@antfu/eslint-config";
import reactPlugin from "@eslint-react/eslint-plugin";

export default antfu({
  type: "lib",
  typescript: true,
  react: true,
  vue: true,
  stylistic: { quotes: "double", semi: true },
  ignores: [
    "**/dist/**",
    "**/.docusaurus/**",
    "apps/website/build/**",
    "apps/website/src/generated/**",
    "coverage/**",
    ".local/**",
  ],
}, {
  rules: {
    "ts/consistent-type-definitions": ["error", "type"],
    "jsonc/sort-keys": "off",
  },
}, {
  files: ["**/*.tsx"],
  rules: { "ts/explicit-function-return-type": "off" },
}, {
  files: ["packages/discord-ui/**", "packages/discord-ui-vue/**"],
  rules: { "react-refresh/only-export-components": "off", "react/no-unknown-property": "off" },
}, {
  files: ["packages/discord-ui-vue/**"],
  rules: {
    ...Object.fromEntries(Object.keys(reactPlugin.rules).map(name => [`react/${name}`, "off"])),
    "react-refresh/only-export-components": "off",
    "ts/explicit-function-return-type": "off",
    "ts/no-use-before-define": "off",
  },
});
