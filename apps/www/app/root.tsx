import {Links, Meta, Outlet, Scripts, ScrollRestoration} from '@remix-run/react';
import {Error} from './components/error';

import './globals.css';

import {GlobalPendingIndicator} from './components/global-pending-indicator';

function App({children}: {children: React.ReactNode}) {
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
