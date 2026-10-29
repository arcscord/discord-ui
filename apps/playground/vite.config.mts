import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig(({ command }) => ({
  plugins: [
    react(),
  ],
  // Development follows package sources with HMR; production resolves the built package.
  resolve: command === "serve"
    ? {
        alias: [
          {
            find: "@arcscord/discord-ui/styles.css",
            replacement: fileURLToPath(new URL("../../packages/discord-ui/src/styles/styles.css", import.meta.url)),
          },
          {
            find: "@arcscord/discord-ui",
            replacement: fileURLToPath(new URL("../../packages/discord-ui/src/index.ts", import.meta.url)),
          },
        ],
      }
    : {},
}));
