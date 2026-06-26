import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

// Unit/integration tests for the chat loop, RAG, and routes. The Anthropic SDK
// and embeddings provider are mocked, so no network or API key is needed. Tests
// run serially to keep the in-memory fixtures deterministic.
export default defineConfig({
  resolve: {
    alias: { '~': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  test: {
    globals: true,
    environment: 'node',
    // Dummy values so env.ts parses at import. These tests mock the Anthropic
    // SDK and embeddings provider and never open a real DB connection.
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
    },
    include: ['src/**/*.{test,spec}.ts'],
    fileParallelism: false,
  },
});
