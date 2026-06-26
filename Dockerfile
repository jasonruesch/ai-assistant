# Multi-stage build: install + build the whole monorepo, then run the API which
# also serves the built web client from a single origin (no CORS in prod).
FROM node:24-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH="$PNPM_HOME:$PATH"
# Prisma's query engine needs OpenSSL at runtime.
RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*
RUN corepack enable
WORKDIR /app

FROM base AS build
COPY . .
RUN pnpm install --frozen-lockfile
# Generate the Prisma client for this (linux) platform, then build web + api.
RUN pnpm --filter @sourcesage/api db:generate
RUN pnpm --filter @sourcesage/web build
RUN pnpm --filter @sourcesage/api build

FROM base AS runtime
ENV NODE_ENV=production
# Copy the fully-installed, built workspace. node_modules carries the generated
# Prisma client and the Prisma CLI used by the Fly release_command (migrations).
COPY --from=build /app /app
ENV WEB_DIST=/app/apps/web/dist
ENV PORT=3000
EXPOSE 3000
CMD ["node", "apps/api/dist/index.js"]
