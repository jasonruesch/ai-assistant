import type Anthropic from '@anthropic-ai/sdk';
import type { StreamEvent } from '@sourcesage/shared';
import { afterEach, describe, expect, it } from 'vitest';
import { setAnthropic } from '~/lib/anthropic.ts';
import { runChat } from '~/chat/stream.ts';

/**
 * A fake MessageStream: async-iterable over raw events, plus finalMessage().
 * Mirrors the slice of the SDK surface runChat() touches.
 */
function fakeStream(
  deltas: unknown[],
  finalMessage: unknown,
): AsyncIterable<unknown> & { finalMessage: () => Promise<unknown> } {
  return {
    async *[Symbol.asyncIterator]() {
      for (const d of deltas) yield d;
    },
    finalMessage: async () => finalMessage,
  };
}

/** Build a fake Anthropic client whose stream() returns queued fakes in order. */
function fakeClient(turns: ReturnType<typeof fakeStream>[]): Anthropic {
  let i = 0;
  return {
    messages: {
      stream: () => turns[i++],
    },
  } as unknown as Anthropic;
}

function textDelta(text: string) {
  return { type: 'content_block_delta', delta: { type: 'text_delta', text } };
}

afterEach(() => setAnthropic(null));

describe('runChat', () => {
  it('streams text and reports usage for a plain turn', async () => {
    setAnthropic(
      fakeClient([
        fakeStream([textDelta('Hello '), textDelta('there')], {
          stop_reason: 'end_turn',
          usage: { input_tokens: 12, output_tokens: 3 },
          content: [{ type: 'text', text: 'Hello there' }],
        }),
      ]),
    );

    const events: StreamEvent[] = [];
    const result = await runChat([{ role: 'user', content: 'hi' }], (e) =>
      events.push(e),
    );

    expect(result.assistantText).toBe('Hello there');
    expect(result.usage).toEqual({ inputTokens: 12, outputTokens: 3 });
    expect(
      events
        .filter((e) => e.type === 'text')
        .map((e) => (e as { text: string }).text),
    ).toEqual(['Hello ', 'there']);
  });

  it('runs the agentic loop: tool_use → tool_result → final answer', async () => {
    setAnthropic(
      fakeClient([
        // Turn 1: the model calls get_current_time (no DB / network needed).
        fakeStream([], {
          stop_reason: 'tool_use',
          usage: { input_tokens: 20, output_tokens: 8 },
          content: [
            {
              type: 'tool_use',
              id: 'tool-1',
              name: 'get_current_time',
              input: { timezone: 'UTC' },
            },
          ],
        }),
        // Turn 2: the model answers using the tool result.
        fakeStream([textDelta('It is now.')], {
          stop_reason: 'end_turn',
          usage: { input_tokens: 30, output_tokens: 5 },
          content: [{ type: 'text', text: 'It is now.' }],
        }),
      ]),
    );

    const events: StreamEvent[] = [];
    const result = await runChat(
      [{ role: 'user', content: 'what time is it?' }],
      (e) => events.push(e),
    );

    const types = events.map((e) => e.type);
    expect(types).toContain('tool_use');
    expect(types).toContain('tool_result');
    expect(result.assistantText).toBe('It is now.');
    // Usage accumulates across both turns.
    expect(result.usage).toEqual({ inputTokens: 50, outputTokens: 13 });

    const toolUse = events.find((e) => e.type === 'tool_use');
    expect(toolUse).toMatchObject({ name: 'get_current_time' });
  });
});
