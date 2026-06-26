import { z } from 'zod';

/**
 * Shared contract between the web client and the API. Both the chat request
 * body and the Server-Sent Events the API streams back are defined here so the
 * two apps can never drift out of sync.
 */

// ---------------------------------------------------------------------------
// Chat request / messages
// ---------------------------------------------------------------------------

export const chatRoleSchema = z.enum(['user', 'assistant']);
export type ChatRole = z.infer<typeof chatRoleSchema>;

export const chatMessageSchema = z.object({
  role: chatRoleSchema,
  content: z.string(),
});
export type ChatMessage = z.infer<typeof chatMessageSchema>;

/** POST /api/chat body. `conversationId` continues an existing thread. */
export const chatRequestSchema = z.object({
  conversationId: z.string().min(1).max(64).optional(),
  message: z.string().min(1, 'Message cannot be empty').max(8000),
});
export type ChatRequest = z.infer<typeof chatRequestSchema>;

// ---------------------------------------------------------------------------
// Retrieval sources (RAG)
// ---------------------------------------------------------------------------

/** A passage retrieved by `search_knowledge_base`, surfaced as a citation. */
export interface Source {
  id: string;
  title: string;
  url?: string;
  snippet: string;
  /** Cosine similarity score in [0, 1]; higher is closer. */
  score: number;
}

// ---------------------------------------------------------------------------
// Stream events (SSE) — the API emits these as `data: <json>\n\n` frames
// ---------------------------------------------------------------------------

export interface TokenUsage {
  inputTokens: number;
  outputTokens: number;
}

export type StreamEvent =
  /** First frame: the (possibly new) conversation id to persist client-side. */
  | { type: 'start'; conversationId: string }
  /** A chunk of the model's summarized reasoning. */
  | { type: 'thinking'; text: string }
  /** A chunk of the model's user-facing answer. */
  | { type: 'text'; text: string }
  /** The model decided to call a tool. */
  | { type: 'tool_use'; id: string; name: string; input: unknown }
  /** A tool finished; `sources` is populated for knowledge-base retrieval. */
  | {
      type: 'tool_result';
      id: string;
      name: string;
      summary: string;
      sources?: Source[];
    }
  /** Terminal success frame. */
  | { type: 'done'; usage: TokenUsage }
  /** Terminal error frame. */
  | { type: 'error'; message: string };

export const STREAM_EVENT_TYPES = [
  'start',
  'thinking',
  'text',
  'tool_use',
  'tool_result',
  'done',
  'error',
] as const;

// ---------------------------------------------------------------------------
// Conversation history DTOs (GET /api/conversations/:id)
// ---------------------------------------------------------------------------

export interface ConversationSummary {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationDetail extends ConversationSummary {
  messages: ChatMessage[];
}
