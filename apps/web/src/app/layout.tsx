import { Outlet } from 'react-router';
import { Providers } from '~/components/providers';

/** Root layout: mounts app-wide providers (Query, Tooltip, theme). */
export default function RootLayout() {
  return (
    <Providers>
      <Outlet />
    </Providers>
  );
}
