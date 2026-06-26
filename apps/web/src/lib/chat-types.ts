import type { Source } from '@sourcesage/shared';

/** A tool call as it progresses, for display in the assistant bubble. */
export interface ToolActivity {
  id: string;
  name: string;
  input: unknown;
  summary?: string;
  done: boolean;
}

/** A message as rendered in the UI (richer than the wire `ChatMessage`). */
export type UiMessage =
  | { id: string; role: 'user'; content: string }
  | {
      id: string;
      role: 'assistant';
      content: string;
      thinking: string;
      tools: ToolActivity[];
      sources: Source[];
      /** True while the turn is still streaming. */
      pending: boolean;
      /** Set if the turn ended in an error. */
      error?: string;
    };
