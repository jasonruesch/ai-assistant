import { TooltipProvider } from '@jasonruesch/react';
import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { queryClient } from '~/lib/query-client';
import { useApplyTheme } from '~/stores/theme.store';

/**
 * App-wide context providers, mounted once in the root layout:
 * - TanStack Query (REST: conversation history)
 * - Tooltip timing (design system)
 * Also reflects the persisted theme onto <html>.
 */
export function Providers({ children }: { children: ReactNode }) {
  useApplyTheme();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
    </QueryClientProvider>
  );
}
