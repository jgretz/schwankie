import {Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData} from '@remix-run/react';
import type {LoaderFunctionArgs} from '@remix-run/node';

import {Error} from './components/error';
import {getClientEnv} from '@www/utils/env';

import './globals.css';

import {GlobalPendingIndicator} from './components/global-pending-indicator';
import {ClientHintCheck, getHints} from './utils/client-hints';
import {getTheme} from '@www/utils/theme.server';
import {useTheme} from './hooks/useTheme';
import type {Theme} from './types';

export async function loader({request}: LoaderFunctionArgs) {
  return {
    requestInfo: {
      hints: getHints(request),
      userPrefs: {
        theme: getTheme(request),
      },
    },
    env: getClientEnv(),
  };
}

function App({children, theme = 'light'}: {children: React.ReactNode; theme?: Theme}) {
  const {env} = useLoaderData<typeof loader>();

  return (
    <html lang="en" className={`${theme} bg-background text-text`}>
      <head>
        <ClientHintCheck />
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
  const theme = useTheme();

  return (
    <App theme={theme}>
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
