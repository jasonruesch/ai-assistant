import type Anthropic from '@anthropic-ai/sdk';
import type {
  ChatMessage,
  StreamEvent,
  TokenUsage,
} from '@sourcesage/shared';
import {
  CHAT_MODEL,
  MAX_TOKENS,
  SYSTEM_PROMPT,
  getAnthropic,
} from '~/lib/anthropic.ts';
import { TOOLS, runTool } from '~/lib/tools.ts';

/** Callback the route uses to forward each event to the SSE response. */
export type Emit = (event: StreamEvent) => void;

export interface ChatResult {
  /** The full assistant answer text (for persistence). */
  assistantText: string;
  usage: TokenUsage;
}

// Safety cap on the agentic loop so a misbehaving tool cycle can't run forever.
const MAX_TURNS = 6;

/**
 * Run a streaming agentic chat turn. On each model turn we stream text and
 * thinking deltas to the client; when Claude requests tools we execute them
 * server-side, stream the results (with RAG citations), append the tool results
 * to the conversation, and continue until the model stops calling tools.
 *
 * Mirrors the SDK's "streaming manual loop": each turn uses `messages.stream()`
 * and `finalMessage()`, and the full `message.content` (including thinking and
 * tool_use blocks) is appended back so the next turn has complete context.
 */
export async function runChat(
  history: ChatMessage[],
  emit: Emit,
): Promise<ChatResult> {
  const client = getAnthropic();
  const messages: Anthropic.MessageParam[] = history.map((m) => ({
    role: m.role,
    content: m.content,
  }));

  let assistantText = '';
  const usage: TokenUsage = { inputTokens: 0, outputTokens: 0 };

  for (let turn = 0; turn < MAX_TURNS; turn++) {
    const stream = client.messages.stream({
      model: CHAT_MODEL,
      max_tokens: MAX_TOKENS,
      system: SYSTEM_PROMPT,
      thinking: { type: 'adaptive', display: 'summarized' },
      tools: TOOLS,
      messages,
    });

    for await (const event of stream) {
      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          assistantText += event.delta.text;
          emit({ type: 'text', text: event.delta.text });
        } else if (event.delta.type === 'thinking_delta') {
          emit({ type: 'thinking', text: event.delta.thinking });
        }
      }
    }

    const message = await stream.finalMessage();
    usage.inputTokens += message.usage.input_tokens;
    usage.outputTokens += message.usage.output_tokens;

    if (message.stop_reason !== 'tool_use') break;

    // Execute every requested tool, then feed results back and loop.
    const toolUses = message.content.filter(
      (b): b is Anthropic.ToolUseBlock => b.type === 'tool_use',
    );

    const toolResults: Anthropic.ToolResultBlockParam[] = [];
    for (const toolUse of toolUses) {
      emit({
        type: 'tool_use',
        id: toolUse.id,
        name: toolUse.name,
        input: toolUse.input,
      });

      const result = await runTool(toolUse.name, toolUse.input);

      emit({
        type: 'tool_result',
        id: toolUse.id,
        name: toolUse.name,
        summary: result.content,
        sources: result.sources,
      });

      toolResults.push({
        type: 'tool_result',
        tool_use_id: toolUse.id,
        content: result.content,
      });
    }

    // Preserve the assistant turn verbatim (thinking + tool_use blocks), then
    // answer with the tool results.
    messages.push({ role: 'assistant', content: message.content });
    messages.push({ role: 'user', content: toolResults });
  }

  return { assistantText, usage };
}
