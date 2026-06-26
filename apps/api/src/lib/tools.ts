import type Anthropic from '@anthropic-ai/sdk';
import type { Source } from '@sourcesage/shared';
import { formatSourcesForModel, searchKnowledgeBase } from '~/lib/rag.ts';

/** Outcome of a tool call: text fed back to the model + optional UI citations. */
export interface ToolResult {
  content: string;
  sources?: Source[];
}

/**
 * Tool definitions advertised to Claude. Descriptions are prescriptive about
 * *when* to call each tool (the recommended pattern for recent models, which
 * reach for tools more conservatively).
 */
export const TOOLS: Anthropic.Tool[] = [
  {
    name: 'search_knowledge_base',
    description:
      'Search the knowledge base about Jason Ruesch, his portfolio projects, ' +
      'and the technologies he uses. Call this for any question about Jason, ' +
      'his work, this site, or its tech stack, and ground your answer in the ' +
      'returned passages.',
    input_schema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'A focused natural-language search query.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'get_current_time',
    description:
      'Get the current date and time. Call this when the user asks what time ' +
      'or date it is, or needs the current moment for a calculation.',
    input_schema: {
      type: 'object',
      properties: {
        timezone: {
          type: 'string',
          description:
            'An IANA timezone, e.g. "America/New_York". Defaults to UTC.',
        },
      },
      required: [],
    },
  },
];

/** Execute a tool call by name and return its result. */
export async function runTool(
  name: string,
  input: unknown,
): Promise<ToolResult> {
  switch (name) {
    case 'search_knowledge_base': {
      const query = String((input as { query?: unknown })?.query ?? '').trim();
      if (!query) {
        return { content: 'No query was provided.', sources: [] };
      }
      const sources = await searchKnowledgeBase(query);
      return { content: formatSourcesForModel(sources), sources };
    }
    case 'get_current_time': {
      const timezone =
        (input as { timezone?: unknown })?.timezone &&
        typeof (input as { timezone?: unknown }).timezone === 'string'
          ? (input as { timezone: string }).timezone
          : 'UTC';
      try {
        const now = new Date().toLocaleString('en-US', { timeZone: timezone });
        return { content: `Current time (${timezone}): ${now}` };
      } catch {
        const now = new Date().toISOString();
        return { content: `Unknown timezone "${timezone}". UTC time: ${now}` };
      }
    }
    default:
      return { content: `Unknown tool: ${name}`, sources: [] };
  }
}
