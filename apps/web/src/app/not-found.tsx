import { Button, Heading, Stack, Text } from '@jasonruesch/react';
import { useNavigate } from 'react-router';
import { useDocumentTitle } from '~/lib/a11y';

export default function RootNotFound() {
  const navigate = useNavigate();
  useDocumentTitle('Not found');
  return (
    <div className="flex min-h-dvh items-center justify-center p-6">
      <Stack gap={3} align="center" className="text-center">
        <Heading level={2}>Page not found</Heading>
        <Text tone="muted" className="max-w-sm">
          The page you&apos;re looking for doesn&apos;t exist or has moved.
        </Text>
        <Button className="mt-2" onClick={() => navigate('/')}>
          Back to chat
        </Button>
      </Stack>
    </div>
  );
}
