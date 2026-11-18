# Pin the Linux/amd64 image, including Chromium, Node and installed system fonts.
FROM mcr.microsoft.com/playwright:v1.64.1-noble@sha256:ee15712262f017b8157421b212b12099146645f44b1bc5c0514cbbe6a229b1d0

ENV CI=true \
    COMPARISON_CONTAINER_ENV=playwright-1.64.1-noble-linux-amd64 \
    PLAYWRIGHT_HTML_OUTPUT_DIR=.local/comparison-report

WORKDIR /workspace
RUN npm install --global pnpm@12.16.1

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/discord-ui/package.json packages/discord-ui/package.json
COPY packages/discord-ui-core/package.json packages/discord-ui-core/package.json
COPY packages/discord-ui-vue/package.json packages/discord-ui-vue/package.json
COPY packages/discord-ui-svelte/package.json packages/discord-ui-svelte/package.json
COPY apps/website/package.json apps/website/package.json
COPY apps/comparison/package.json apps/comparison/package.json
RUN pnpm install --frozen-lockfile --ignore-scripts

COPY . .
RUN node -e 'if (process.versions.node.split(".")[0] !== "26" || require("@playwright/test/package.json").version !== "1.64.1") throw new Error("Update the pinned comparison image to match the workspace toolchain.")' \
    && pnpm build:comparison \
    && mkdir -p .local

ENTRYPOINT ["pnpm", "exec", "playwright", "test", "-c", "playwright.comparison.config.mts"]
