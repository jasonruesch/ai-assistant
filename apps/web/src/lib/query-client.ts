import { QueryClient } from '@tanstack/react-query';

/**
 * Shared TanStack Query client for REST reads (conversation history). The chat
 * stream itself is driven imperatively (see lib/chat-stream.ts), not through
 * Query, because it's a long-lived SSE response rather than a cached fetch.
 */
export function createQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  });
}

export const queryClient = createQueryClient();
