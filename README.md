# SourceSage

An LLM-powered application built for real use: **streaming responses, tool use,
and retrieval-augmented context (RAG)**, wrapping Anthropic's Claude in a fast,
accessible interface built on the [`@jasonruesch/react`](https://github.com/jasonruesch/design-system)
design system.

Live: https://sourcesage.fly.dev

## What it does

Ask the assistant about Jason Ruesch's portfolio, his projects, or the
technology behind them. The backend runs an **agentic tool-use loop** against
Claude (`claude-opus-4-8`, adaptive thinking) and streams the response —
including the model's summarized reasoning and any tool activity — to the
browser over **Server-Sent Events**. Questions about the portfolio trigger a
`search_knowledge_base` tool that performs RAG: it embeds the query, runs a
**pgvector** cosine-similarity search over an ingested corpus, and returns the
matching passages, which are rendered as cited sources.

## Architecture

A Turborepo monorepo, single-origin in production (the API serves the built SPA
plus `/api`), deployed to Fly.io — the same shape as the
[Full-Stack Platform](https://github.com/jasonruesch/full-stack-platform).

```
apps/
  web/   React 19 + Vite SPA — chat UI on the design system, file-based routing,
         Tailwind v4, theming, an SSE client that streams tokens/thinking/tools
  api/   Fastify 5 — POST /api/chat (SSE) running a streaming Anthropic agentic
         loop with tool use; RAG over Postgres + pgvector; Prisma
packages/
  shared/  zod schemas + the shared SSE event types
```

| Layer      | Tech                                                                                                      |
| ---------- | --------------------------------------------------------------------------------------------------------- |
| Frontend   | React 19, Vite, `@evolonix/react-router-next`, Tailwind v4, `@jasonruesch/react`, TanStack Query, Zustand |
| Backend    | Fastify 5, Node 24, Prisma, PostgreSQL + pgvector, `@anthropic-ai/sdk`                                    |
| LLM        | Claude `claude-opus-4-8`, adaptive thinking, streaming, tool use                                          |
| Embeddings | Voyage AI (`voyage-3`) — Claude has no embeddings endpoint; pluggable                                     |
| Database   | PostgreSQL + pgvector — `pgvector/pgvector` image locally / in CI, Neon in production                     |
| Deploy     | Fly.io (single container) + Neon, via GitHub Actions                                                      |

### Notes on scope

This is a public demo, so — unlike the Full-Stack Platform — there is **no
authentication** (conversations are keyed by a server-issued id) and **no
GraphQL** (chat is a streaming endpoint, not a query graph). The `ANTHROPIC_API_KEY`
lives only in the server environment and is never shipped to the browser.

## Local development

Prerequisites: Node 24, pnpm 11, Docker (for Postgres), an
[Anthropic API key](https://console.anthropic.com/), and a
[Voyage AI API key](https://www.voyageai.com/).

```sh
pnpm install
cp apps/api/.env.example apps/api/.env   # then fill in ANTHROPIC_API_KEY + VOYAGE_API_KEY

docker compose up -d                     # Postgres with pgvector
pnpm --filter @sourcesage/api db:migrate
pnpm --filter @sourcesage/api db:seed  # chunk + embed the corpus

pnpm dev                                 # web on :5173, api on :3000
```

Open http://localhost:5173 and ask about the portfolio.

The RAG corpus lives in `apps/api/prisma/corpus/*.md`; edit it and re-run
`db:seed` to change what the assistant knows.

## Testing

```sh
pnpm lint
pnpm typecheck
pnpm test          # API loop (Anthropic SDK + embeddings mocked) + web a11y
pnpm --filter @sourcesage/web test:e2e   # Playwright (UI shell, no key needed)
```

The chat round-trip is exercised by unit tests with the Anthropic SDK mocked, so
the suite needs no API key.

## Deployment (Fly.io + Neon)

The app runs on Fly.io as a single container that serves the built SPA plus
`/api`. Postgres is hosted on [Neon](https://neon.tech), which includes
pgvector — you don't enable anything in the Neon console; the release migration
creates the extension itself (`CREATE EXTENSION IF NOT EXISTS "vector"`).

### 1. Create a Neon database

Create a Neon project, then copy its connection string from the dashboard.
**Use the direct (unpooled) string** — `prisma migrate deploy` runs DDL and
advisory locks that fail through Neon's `-pooler` (PgBouncer) endpoint. (The app
is a single long-lived server, so it doesn't need the pooler at runtime either.)
Copy the string verbatim, including the full query suffix:

```
postgresql://<user>:<password>@<endpoint>.<region>.aws.neon.tech/<db>?sslmode=require
```

> Toggle **"Pooled connection" off** in Neon, or remove `-pooler` from the host
> if you copied the pooled URL.

### 2. Create the Fly app and set secrets

```sh
fly launch --no-deploy   # creates the app from fly.toml (app name: sourcesage)

fly secrets set \
  DATABASE_URL='postgresql://USER:PASSWORD@ENDPOINT.REGION.aws.neon.tech/DB?sslmode=require' \
  ANTHROPIC_API_KEY='sk-ant-…' \
  VOYAGE_API_KEY='pa-…' \
  -a sourcesage
```

All three are required before the first deploy: `DATABASE_URL` (Neon),
`ANTHROPIC_API_KEY` (chat), and `VOYAGE_API_KEY` (embeddings — the release seeds
the corpus and will fail at the embedding step without it). Setting
`DATABASE_URL` here overrides any value a previous `fly postgres attach` set; a
leftover Fly Postgres app can be removed with
`fly postgres detach <pg-app> -a sourcesage`.

### 3. Deploy

```sh
fly deploy
```

The release command (`pnpm --filter @sourcesage/api run release`) runs
`prisma migrate deploy` — creating the `vector` extension, tables, and indexes
on Neon — and then seeds the corpus. The app then serves on
https://sourcesage.fly.dev.

CI redeploys on every push to `main` via `.github/workflows/fly-deploy.yml`
(needs a `FLY_API_TOKEN` repo secret). Local dev and CI use the
`pgvector/pgvector` Postgres image rather than Neon.
