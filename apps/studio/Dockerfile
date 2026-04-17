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
COPY apps/studio/package.json apps/studio/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/database/package.json packages/database/package.json
COPY packages/react/package.json packages/react/package.json
COPY tooling/build/package.json tooling/build/package.json
COPY tooling/typescript/package.json tooling/typescript/package.json

RUN bun install --frozen-lockfile --ignore-scripts

FROM deps AS build
WORKDIR /app

COPY . .

RUN bun run --filter '@dsqr-dotdev/database' build
RUN bun run --filter '@dsqr-dotdev/core' build
RUN bun run --filter 'studio' build

FROM node:24-slim AS runner
WORKDIR /app/apps/studio

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV NITRO_HOST=0.0.0.0
ENV PORT=3021

RUN npm init -y \
  && npm install --omit=dev pg@8.16.3

COPY --from=build --chown=node:node /app/apps/studio/.output ./.output

EXPOSE 3021

USER node

CMD ["node", ".output/server/index.mjs"]
