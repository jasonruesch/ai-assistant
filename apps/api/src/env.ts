import { z } from 'zod';

// Load apps/api/.env in development. In production (Docker/Fly) there is no
// .env file and the variables come from the real environment, so a missing
// file is expected — swallow the error.
try {
  process.loadEnvFile();
} catch {
  // no .env file present
}

/**
 * Validated process environment. Fails fast at boot if a required variable is
 * missing or malformed. The API keys are optional at boot (so the server and
 * its tests can start without them); the chat and embeddings code surfaces a
 * clear error if a key is missing at the moment it's actually needed.
 */
const envSchema = z.object({
  NODE_ENV: z
    .enum(['development', 'test', 'production'])
    .default('development'),
  DATABASE_URL: z.string().url(),
  // Server-only — never exposed to the browser.
  ANTHROPIC_API_KEY: z.string().optional(),
  // Embeddings provider key (RAG). Optional at boot; required when retrieval runs.
  VOYAGE_API_KEY: z.string().optional(),
  PORT: z.coerce.number().int().positive().default(3000),
  HOST: z.string().default('0.0.0.0'),
  // Absolute path to the built web client to serve as static files. When unset,
  // the API runs API-only (the Vite dev server serves the client in dev).
  WEB_DIST: z.string().optional(),
});

export const env = envSchema.parse(process.env);

export type Env = z.infer<typeof envSchema>;
