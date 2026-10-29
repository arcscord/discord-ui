import antfu from "@antfu/eslint-config";

export default antfu({
  type: "lib",
  typescript: true,
  react: true,
  stylistic: { quotes: "double", semi: true },
  ignores: ["**/dist/**", "coverage/**", ".local/**"],
}, {
  rules: {
    "ts/consistent-type-definitions": ["error", "type"],
    "jsonc/sort-keys": "off",
  },
});
