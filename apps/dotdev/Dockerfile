# syntax=docker/dockerfile:1.7

FROM node:24-slim AS base
WORKDIR /app

COPY --from=oven/bun:1.3.11 /usr/local/bin/bun /usr/local/bin/bun
RUN ln -s /usr/local/bin/bun /usr/local/bin/bunx \
  && apt-get update \
  && apt-get install -y --no-install-recommends python3 make g++ \
  && rm -rf /var/lib/apt/lists/*

FROM base AS deps
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/dotdev/package.json apps/dotdev/package.json
COPY apps/studio/package.json apps/studio/package.json
COPY packages/blog-post/package.json packages/blog-post/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/ui/package.json packages/ui/package.json
COPY tooling/build/package.json tooling/build/package.json
COPY tooling/typescript/package.json tooling/typescript/package.json

RUN bun install --frozen-lockfile --ignore-scripts

FROM deps AS build
WORKDIR /app

COPY . .

RUN bun run --filter '@dsqr-dotdev/db' build
RUN bun run --filter '@dsqr-dotdev/core' build
RUN bun run --filter 'dotdev' build

FROM node:24-slim AS runner
WORKDIR /app/apps/dotdev

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV PORT=3020

RUN npm init -y \
  && npm install --omit=dev pg@8.16.3

COPY --from=build --chown=node:node /app/apps/dotdev/.output ./.output

EXPOSE 3020

USER node

CMD ["node", ".output/server/index.mjs"]
