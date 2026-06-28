import { cn } from '@jasonruesch/react';
import type { ComponentPropsWithoutRef } from 'react';
import ReactMarkdown, { type Components } from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import remarkGfm from 'remark-gfm';

/**
 * Maps the assistant's markdown onto design-system tokens so responses render
 * with real headings, lists, links, tables, and code instead of raw `**` and
 * backtick characters. Streaming-safe: re-parses cleanly on each token.
 */
const components: Components = {
  p: ({ className, ...props }) => (
    <p className={cn('break-words', className)} {...props} />
  ),
  a: ({ className, ...props }) => (
    <a
      target="_blank"
      rel="noreferrer"
      className={cn(
        'font-medium text-accent underline underline-offset-2 hover:text-accent-hover',
        className,
      )}
      {...props}
    />
  ),
  ul: ({ className, ...props }) => (
    <ul className={cn('list-disc pl-5', className)} {...props} />
  ),
  ol: ({ className, ...props }) => (
    <ol className={cn('list-decimal pl-5', className)} {...props} />
  ),
  li: ({ className, ...props }) => (
    <li className={cn('my-0.5', className)} {...props} />
  ),
  h1: ({ className, ...props }) => (
    <h1
      className={cn('mt-4 mb-2 text-lg font-semibold text-fg', className)}
      {...props}
    />
  ),
  h2: ({ className, ...props }) => (
    <h2
      className={cn('mt-4 mb-2 text-base font-semibold text-fg', className)}
      {...props}
    />
  ),
  h3: ({ className, ...props }) => (
    <h3
      className={cn('mt-3 mb-1.5 text-sm font-semibold text-fg', className)}
      {...props}
    />
  ),
  strong: ({ className, ...props }) => (
    <strong className={cn('font-semibold text-fg', className)} {...props} />
  ),
  blockquote: ({ className, ...props }) => (
    <blockquote
      className={cn(
        'border-l-2 border-line pl-3 text-fg-muted italic',
        className,
      )}
      {...props}
    />
  ),
  hr: ({ className, ...props }) => (
    <hr className={cn('my-3 border-line-muted', className)} {...props} />
  ),
  code: ({ className, children, ...props }) => {
    const isBlock =
      className?.includes('language-') || String(children).includes('\n');
    if (isBlock) {
      return (
        <code className={cn('font-mono text-xs', className)} {...props}>
          {children}
        </code>
      );
    }
    return (
      <code
        className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.85em] text-fg"
        {...props}
      >
        {children}
      </code>
    );
  },
  pre: ({ className, ...props }: ComponentPropsWithoutRef<'pre'>) => (
    <pre
      className={cn(
        'my-2 overflow-x-auto rounded-lg border border-line-muted bg-canvas p-3',
        className,
      )}
      {...props}
    />
  ),
  table: ({ className, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table
        className={cn('w-full border-collapse text-left text-sm', className)}
        {...props}
      />
    </div>
  ),
  th: ({ className, ...props }) => (
    <th
      className={cn(
        'border border-line-muted bg-surface px-2 py-1 font-semibold',
        className,
      )}
      {...props}
    />
  ),
  td: ({ className, ...props }) => (
    <td
      className={cn('border border-line-muted px-2 py-1', className)}
      {...props}
    />
  ),
};

export function Markdown({ children }: { children: string }) {
  return (
    <div className="flex flex-col gap-2 break-words">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[[rehypeHighlight, { detect: true, ignoreMissing: true }]]}
        components={components}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
