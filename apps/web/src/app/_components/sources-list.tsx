import { Text } from '@jasonruesch/react';
import { ExternalLink, FileText } from 'lucide-react';
import type { Source } from '@sourcesage/shared';

/** Citations panel: the passages the assistant retrieved, numbered [1], [2], …. */
export function SourcesList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;

  return (
    <section
      aria-label="Sources"
      className="mt-3 rounded-lg border border-line-muted bg-surface/60 p-3"
    >
      <Text
        size="xs"
        tone="muted"
        className="mb-2 flex items-center gap-1.5 font-medium tracking-wide uppercase"
      >
        <FileText size={12} aria-hidden /> Sources
      </Text>
      <ol className="flex flex-col gap-2">
        {sources.map((source, i) => (
          <li key={source.id} className="flex gap-2 text-sm">
            <span
              aria-hidden
              className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded bg-accent-subtle text-xs font-semibold text-accent"
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-medium text-fg">{source.title}</span>
                {source.url && (
                  <a
                    href={source.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-fg-subtle hover:text-accent"
                    aria-label={`Open ${source.title} in a new tab`}
                  >
                    <ExternalLink size={12} aria-hidden />
                  </a>
                )}
              </div>
              <Text size="xs" tone="muted" className="line-clamp-2">
                {source.snippet}
              </Text>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
