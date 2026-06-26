import Anthropic from '@anthropic-ai/sdk';
import { env } from '~/env.ts';

/** Model + generation config, centralized so the chat loop stays declarative. */
export const CHAT_MODEL = 'claude-opus-4-8';
export const MAX_TOKENS = 8000;

export const SYSTEM_PROMPT = `You are SourceSage, the AI assistant for Jason Ruesch's developer portfolio — a helpful, concise, technically literate guide.

You have a tool, search_knowledge_base, backed by a small knowledge base about Jason, his portfolio, and the technologies he uses. Call it whenever the user asks anything about Jason, his projects, this site, or the tech behind them — do not answer those from memory. Ground your answer in the retrieved passages and cite them inline as [1], [2], … matching the returned sources. If the knowledge base has nothing relevant, say so plainly rather than inventing details.

For general questions unrelated to the portfolio, answer directly without the tool. Keep answers focused and skimmable; prefer short paragraphs and lists. Lead with the answer, then supporting detail.`;

let client: Anthropic | null = null;

/**
 * Lazily construct the Anthropic client. Throws a clear error if the key is
 * missing — called at request time, never at boot, so the server and its tests
 * start without a key.
 */
export function getAnthropic(): Anthropic {
  if (client) return client;
  if (!env.ANTHROPIC_API_KEY) {
    throw new Error(
      'ANTHROPIC_API_KEY is not set — required to chat. ' +
        'Set it in apps/api/.env (see .env.example).',
    );
  }
  client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
  return client;
}

/** Test seam: inject a fake/mock client. */
export function setAnthropic(instance: Anthropic | null): void {
  client = instance;
}
