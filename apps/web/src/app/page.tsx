import { Button, Heading, IconButton, Text } from '@jasonruesch/react';
import { Bot, Plus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { ThemeToggleButton } from '~/components/appearance';
import type { UiMessage } from '~/lib/chat-types';
import { streamChat } from '~/lib/chat-stream';
import { useDocumentTitle } from '~/lib/a11y';
import { ChatMessage } from './_components/chat-message';
import { Composer } from './_components/composer';

const SUGGESTIONS = [
  'What projects are in this portfolio?',
  'What is the design system built with?',
  'How does this AI assistant work under the hood?',
];

function newId(): string {
  return crypto.randomUUID();
}

export default function ChatPage() {
  useDocumentTitle('Chat');
  const [messages, setMessages] = useState<UiMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the latest message in view as it streams.
  useEffect(() => {
    const el = scrollRef.current;
    el?.scrollTo?.({ top: el.scrollHeight });
  }, [messages]);

  async function handleSend(text: string) {
    const assistantId = newId();
    setMessages((prev) => [
      ...prev,
      { id: newId(), role: 'user', content: text },
      {
        id: assistantId,
        role: 'assistant',
        content: '',
        thinking: '',
        tools: [],
        sources: [],
        pending: true,
      },
    ]);
    setStreaming(true);

    const controller = new AbortController();
    abortRef.current = controller;

    const patch = (
      fn: (m: Extract<UiMessage, { role: 'assistant' }>) => UiMessage,
    ) =>
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId && m.role === 'assistant' ? fn(m) : m,
        ),
      );

    try {
      await streamChat(
        { message: text, conversationId },
        (event) => {
          switch (event.type) {
            case 'start':
              setConversationId(event.conversationId);
              break;
            case 'text':
              patch((m) => ({ ...m, content: m.content + event.text }));
              break;
            case 'thinking':
              patch((m) => ({ ...m, thinking: m.thinking + event.text }));
              break;
            case 'tool_use':
              patch((m) => ({
                ...m,
                tools: [
                  ...m.tools,
                  {
                    id: event.id,
                    name: event.name,
                    input: event.input,
                    done: false,
                  },
                ],
              }));
              break;
            case 'tool_result':
              patch((m) => {
                const merged = [...m.sources];
                for (const s of event.sources ?? []) {
                  if (!merged.some((existing) => existing.id === s.id))
                    merged.push(s);
                }
                return {
                  ...m,
                  tools: m.tools.map((t) =>
                    t.id === event.id
                      ? { ...t, done: true, summary: event.summary }
                      : t,
                  ),
                  sources: merged,
                };
              });
              break;
            case 'done':
              patch((m) => ({ ...m, pending: false }));
              break;
            case 'error':
              patch((m) => ({ ...m, pending: false, error: event.message }));
              break;
          }
        },
        controller.signal,
      );
    } catch {
      // Aborted or network error — leave any partial content, stop the spinner.
      patch((m) => ({ ...m, pending: false }));
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  function handleStop() {
    abortRef.current?.abort();
  }

  function handleNewChat() {
    abortRef.current?.abort();
    setMessages([]);
    setConversationId(undefined);
  }

  const isEmpty = messages.length === 0;

  return (
    <div className="flex h-dvh flex-col">
      <a
        href="#chat-main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-on-accent focus:not-sr-only focus:absolute focus:top-3 focus:left-4"
      >
        Skip to conversation
      </a>

      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-canvas/90 px-4 backdrop-blur sm:px-6">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-md bg-accent text-on-accent">
            <Bot size={18} aria-hidden />
          </span>
          <span className="text-lg font-bold tracking-tight">SourceSage</span>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            variant="ghost"
            aria-label="New chat"
            onClick={handleNewChat}
            disabled={isEmpty && !streaming}
          >
            <Plus size={18} aria-hidden />
          </IconButton>
          <ThemeToggleButton />
        </div>
      </header>

      <main
        id="chat-main"
        ref={scrollRef}
        tabIndex={-1}
        className="flex-1 overflow-y-auto outline-none"
      >
        <div className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
          {isEmpty ? (
            <div className="flex min-h-[60dvh] flex-col items-center justify-center gap-6 text-center">
              <span className="flex size-14 items-center justify-center rounded-2xl bg-accent text-on-accent">
                <Bot size={28} aria-hidden />
              </span>
              <div className="space-y-1">
                <Heading level={2}>How can I help?</Heading>
                <Text tone="muted" className="max-w-md">
                  Ask about Jason&apos;s portfolio, the projects, or the tech
                  behind them. Answers are grounded in a knowledge base with
                  cited sources.
                </Text>
              </div>
              <ul className="flex w-full max-w-md flex-col gap-2">
                {SUGGESTIONS.map((s) => (
                  <li key={s}>
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={() => handleSend(s)}
                    >
                      {s}
                    </Button>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {messages.map((message) => (
                <ChatMessage key={message.id} message={message} />
              ))}
            </div>
          )}
        </div>
      </main>

      <div className="shrink-0 border-t border-line bg-canvas px-4 py-3 sm:px-6">
        <div className="mx-auto w-full max-w-3xl">
          <Composer
            streaming={streaming}
            onSend={handleSend}
            onStop={handleStop}
          />
          <Text size="xs" tone="subtle" className="mt-2 text-center">
            Responses are generated by Claude and may be inaccurate.
          </Text>
        </div>
      </div>
    </div>
  );
}
