import { Button, Stack } from '@jasonruesch/react';
import { useNavigate, useRouteError } from 'react-router';
import { DataError } from '~/components/feedback';
import { useDocumentTitle } from '~/lib/a11y';

/** Root error boundary. */
export default function RootError() {
  const error = useRouteError();
  const navigate = useNavigate();
  useDocumentTitle('Error');
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Stack gap={4} align="center">
        <DataError
          title="The app hit an error"
          error={error}
          onRetry={() => navigate(0)}
        />
        <Button variant="ghost" onClick={() => navigate('/')}>
          Back to chat
        </Button>
      </Stack>
    </div>
  );
}
