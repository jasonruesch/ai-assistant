# Technology Stack

## Frontend

React 19 with Vite for the build, file-based routing via
`@evolonix/react-router-next`, Tailwind CSS v4 for styling, and the
`@jasonruesch/react` design system for accessible components. Client state uses
Zustand; server state uses TanStack Query for REST. Theming is light/dark/system
via a `data-theme` attribute on the document root.

## Backend

Fastify 5 on Node 24, written in TypeScript and bundled with tsup. Data access
is through Prisma against PostgreSQL. The SourceSage backend adds the official
Anthropic TypeScript SDK (`@anthropic-ai/sdk`) and pgvector for vector search.

## AI integration

The assistant uses Anthropic's Claude model `claude-opus-4-8` with adaptive
thinking. Responses stream token-by-token to the browser over Server-Sent
Events. An agentic loop lets the model call tools: `search_knowledge_base`
performs retrieval-augmented generation by embedding the query (Voyage AI),
running a pgvector cosine-similarity search, and returning the most relevant
passages as cited sources.

## Deployment

SourceSage and the Full-Stack Platform deploy to Fly.io as a single container
that serves both the API and the built single-page app from one origin. The
portfolio, design system docs, and web application deploy to GitHub Pages via
GitHub Actions. Continuous integration runs lint, typecheck, unit tests, build,
and end-to-end Playwright tests on every change.
