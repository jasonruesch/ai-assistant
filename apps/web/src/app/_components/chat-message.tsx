import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Alert,
  AlertDescription,
  Spinner,
  cn,
} from '@jasonruesch/react';
import { Bot, User } from 'lucide-react';
import type { UiMessage } from '~/lib/chat-types';
import { SourcesList } from './sources-list';
import { ToolActivityList } from './tool-activity';

function Avatar({ role }: { role: 'user' | 'assistant' }) {
  const isUser = role === 'user';
  const Icon = isUser ? User : Bot;
  return (
    <span
      aria-hidden
      className={cn(
        'flex size-8 shrink-0 items-center justify-center rounded-full',
        isUser ? 'bg-muted text-fg' : 'bg-accent text-on-accent',
      )}
    >
      <Icon size={18} />
    </span>
  );
}

/** A single chat turn. User turns are plain; assistant turns are rich. */
export function ChatMessage({ message }: { message: UiMessage }) {
  const isUser = message.role === 'user';

  return (
    <article
      className={cn('flex gap-3', isUser && 'flex-row-reverse')}
      aria-label={isUser ? 'You' : 'Assistant'}
    >
      <Avatar role={message.role} />
      <div
        className={cn(
          'max-w-[42rem] min-w-0 flex-1',
          isUser && 'flex justify-end',
        )}
      >
        <div
          className={cn(
            'rounded-2xl px-4 py-3 text-sm leading-relaxed',
            isUser ? 'bg-accent text-on-accent' : 'w-full bg-surface text-fg',
          )}
        >
          {message.role === 'assistant' ? (
            <AssistantBody message={message} />
          ) : (
            <p className="break-words whitespace-pre-wrap">{message.content}</p>
          )}
        </div>
      </div>
    </article>
  );
}

function AssistantBody({
  message,
}: {
  message: Extract<UiMessage, { role: 'assistant' }>;
}) {
  const showTypingDots =
    message.pending && !message.content && message.tools.length === 0;

  return (
    <div className="flex flex-col">
      {message.thinking && (
        <Accordion type="single" collapsible className="mb-2">
          <AccordionItem value="thinking" className="border-none">
            <AccordionTrigger className="py-1 text-xs text-fg-muted">
              Thinking
            </AccordionTrigger>
            <AccordionContent>
              <p className="text-xs break-words whitespace-pre-wrap text-fg-muted">
                {message.thinking}
              </p>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}

      <ToolActivityList tools={message.tools} />

      {showTypingDots && (
        <span className="flex items-center gap-2 text-fg-muted">
          <Spinner size="sm" aria-hidden /> Thinking…
        </span>
      )}

      {message.content && (
        <p className="break-words whitespace-pre-wrap">{message.content}</p>
      )}

      {message.error && (
        <Alert variant="danger" className="mt-2">
          <AlertDescription>{message.error}</AlertDescription>
        </Alert>
      )}

      <SourcesList sources={message.sources} />
    </div>
  );
}
