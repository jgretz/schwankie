import {Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData} from '@remix-run/react';
import {Error} from './components/error';
import {getClientEnv} from '@www/utils/env';

import './globals.css';

import {GlobalPendingIndicator} from './components/global-pending-indicator';

export async function loader() {
  return {
    env: getClientEnv(),
  };
}

function App({children}: {children: React.ReactNode}) {
  const {env} = useLoaderData<typeof loader>();

  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <GlobalPendingIndicator />
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `window.ENV = ${JSON.stringify(env)}`,
          }}
        />
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function Root() {
  return (
    <App>
      <Outlet />
    </App>
  );
}

export function ErrorBoundary() {
  return (
    <App>
      <Error />
    </App>
  );
}
