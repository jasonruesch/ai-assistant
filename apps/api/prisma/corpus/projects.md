# Portfolio Projects

## Design System

A reusable, accessible, themeable component library and design-token set,
published to npm as `@jasonruesch/react` (components) and `@jasonruesch/tokens`
(design tokens). It is built with React 19, Tailwind CSS v4, Radix UI
primitives, and class-variance-authority, documented in Storybook, and hosted at
jasonruesch.dev/design-system. Every other app in the portfolio consumes it.

## Web Application

A production-style frontend product (TaskFlow) exercising the full frontend
stack: authentication, file-based routing, REST and GraphQL data fetching,
client and server state, and light/dark theming. It uses Mock Service Worker
(MSW) to serve deterministic data with no real backend, and deploys to GitHub
Pages.

## Full-Stack Platform

BookmarkVault — an end-to-end product with a real backend. Save links into
collections, tag and search them, and share collections publicly. A Fastify +
Prisma + PostgreSQL backend serves both REST and GraphQL with JWT auth, deployed
end to end on Fly.io with no mocks.

## SourceSage

An LLM-powered application built for real use: streaming responses, tool use,
and retrieval-augmented context, wrapping Anthropic's Claude in a fast,
accessible interface built on the design system. The backend is a Fastify
service that streams from Claude over Server-Sent Events, runs an agentic
tool-use loop, and grounds answers in a knowledge base via pgvector similarity
search. It deploys to Fly.io, mirroring the Full-Stack Platform's architecture.

## Developer Tooling

A command-line tool and supporting libraries that automate repetitive developer
tasks — from code generation to release pipelines — built with Node.js and
TypeScript, with a focus on speed, clear output, and great ergonomics.
