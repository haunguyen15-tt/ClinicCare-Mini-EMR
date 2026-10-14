# The Nuxt app: SSR pages plus the /api BFF that talks to the backend for the browser.

# --- Build ---
FROM node:22-slim AS build
WORKDIR /app

COPY package.json package-lock.json ./
# Scripts are skipped here: the postinstall (`nuxt prepare`) needs the sources, and
# `nuxt build` below prepares the app anyway.
RUN npm ci --ignore-scripts

COPY . .
RUN npx nuxt build

# --- Run ---
FROM node:22-slim
ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=3000
WORKDIR /app

# The build output is self-contained; no node_modules needed at run time.
COPY --from=build --chown=node:node /app/.output ./.output

USER node
EXPOSE 3000

HEALTHCHECK --interval=10s --timeout=3s --start-period=15s --retries=5 \
    CMD ["node", "-e", "fetch('http://127.0.0.1:3000/login').then((r) => process.exit(r.ok ? 0 : 1), () => process.exit(1))"]

CMD ["node", ".output/server/index.mjs"]
