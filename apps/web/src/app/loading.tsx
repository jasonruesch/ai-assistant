import { PageLoader } from '~/components/feedback';

export default function RootLoading() {
  return (
    <div className="flex min-h-dvh items-center justify-center">
      <PageLoader />
    </div>
  );
}
