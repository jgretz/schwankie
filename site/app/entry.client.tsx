/**
 * By default, Remix will handle hydrating your app on the client for you.
 * You are free to delete this file if you'd like to, but if you ever want it revealed again, you can run `npx remix reveal` ✨
 * For more information, see https://remix.run/file-conventions/entry.client
 */

import { RemixBrowser, useLocation, useMatches } from "@remix-run/react";
import { startTransition, StrictMode, useEffect } from "react";
import { hydrateRoot } from "react-dom/client";

import * as Sentry from "@sentry/remix";

Sentry.init({
  dsn: "https://17876285cb801868c782c52a0b0e4713@o4505630216814592.ingest.sentry.io/4505630227955712",
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.remixRouterInstrumentation(
        useEffect,
        useLocation,
        useMatches
      ),
    }),
    
    new Sentry.Replay(),
  ],

  tracesSampleRate: 1.0,
  tracePropagationTargets: ["localhost", /^https:\/\/schwankie\.com/, /^https:\/\/schwankie-api\.fly\.dev/],

  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
});

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <RemixBrowser />
    </StrictMode>
  );
});
