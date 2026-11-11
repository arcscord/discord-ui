import vue from "@vitejs/plugin-vue";
import vueJsx from "@vitejs/plugin-vue-jsx";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    vue(),
    vueJsx({ include: /discord-ui-vue\/.*\.tsx$/, tsTransform: "built-in" }),
  ],
  test: {
    include: ["packages/*/tests/**/*.test.{ts,tsx}", "apps/*/tests/**/*.test.{ts,tsx}", "scripts/**/*.test.mts"],
    environment: "node",
  },
});
