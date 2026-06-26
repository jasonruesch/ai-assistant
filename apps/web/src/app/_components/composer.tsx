import { IconButton, Textarea } from '@jasonruesch/react';
import { ArrowUp, Square } from 'lucide-react';
import { type FormEvent, type KeyboardEvent, useState } from 'react';

interface ComposerProps {
  streaming: boolean;
  onSend: (message: string) => void;
  onStop: () => void;
}

/** Message input: Enter sends, Shift+Enter inserts a newline. */
export function Composer({ streaming, onSend, onStop }: ComposerProps) {
  const [value, setValue] = useState('');

  const submit = (event?: FormEvent) => {
    event?.preventDefault();
    const trimmed = value.trim();
    if (!trimmed || streaming) return;
    onSend(trimmed);
    setValue('');
  };

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  };

  return (
    <form
      onSubmit={submit}
      className="flex items-end gap-2 rounded-2xl border border-line bg-surface p-2 focus-within:border-accent"
    >
      <Textarea
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onKeyDown}
        rows={1}
        aria-label="Message the assistant"
        placeholder="Ask about Jason's projects, the tech stack, anything…"
        className="max-h-40 min-h-10 flex-1 resize-none border-none bg-transparent focus-visible:ring-0"
      />
      {streaming ? (
        <IconButton
          type="button"
          variant="outline"
          aria-label="Stop generating"
          onClick={onStop}
        >
          <Square size={16} aria-hidden />
        </IconButton>
      ) : (
        <IconButton
          type="submit"
          aria-label="Send message"
          disabled={!value.trim()}
        >
          <ArrowUp size={18} aria-hidden />
        </IconButton>
      )}
    </form>
  );
}
