import {
  Alert,
  AlertDescription,
  AlertTitle,
  Button,
  Spinner,
} from '@jasonruesch/react';

/** Centered spinner — used as the body of `loading.tsx` boundaries. */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex min-h-64 w-full items-center justify-center p-8">
      <Spinner size="lg" label={label} />
    </div>
  );
}

/** Error fallback — used as the body of `error.tsx` boundaries. */
export function DataError({
  title = 'Something went wrong',
  error,
  onRetry,
}: {
  title?: string;
  error?: unknown;
  onRetry?: () => void;
}) {
  const message =
    error instanceof Error ? error.message : 'An unexpected error occurred.';
  return (
    <div className="flex min-h-64 w-full items-center justify-center p-8">
      <Alert variant="danger" className="max-w-md">
        <AlertTitle>{title}</AlertTitle>
        <AlertDescription>{message}</AlertDescription>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={onRetry}
          >
            Try again
          </Button>
        )}
      </Alert>
    </div>
  );
}
