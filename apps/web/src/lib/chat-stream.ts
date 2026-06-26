import type { ChatRequest, StreamEvent } from '@sourcesage/shared';

/**
 * POST a chat turn and drive `onEvent` with each Server-Sent Event the API
 * streams back (start → thinking|text|tool_* … → done|error). Resolves when the
 * stream ends. Pass an `AbortSignal` to cancel an in-flight turn.
 */
export async function streamChat(
  body: ChatRequest,
  onEvent: (event: StreamEvent) => void,
  signal?: AbortSignal,
): Promise<void> {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'text/event-stream',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok || !response.body) {
    const data = await response.json().catch(() => null);
    const message =
      (data && typeof data === 'object' && 'message' in data
        ? String((data as { message: unknown }).message)
        : null) ?? `Request failed (${response.status})`;
    onEvent({ type: 'error', message });
    return;
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { value, done } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    // SSE frames are separated by a blank line.
    let boundary: number;
    while ((boundary = buffer.indexOf('\n\n')) !== -1) {
      const frame = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);

      const dataLine = frame
        .split('\n')
        .find((line) => line.startsWith('data:'));
      if (!dataLine) continue;

      const json = dataLine.slice(5).trim();
      if (!json) continue;

      try {
        onEvent(JSON.parse(json) as StreamEvent);
      } catch {
        // Ignore malformed frames rather than aborting the whole stream.
      }
    }
  }
}
