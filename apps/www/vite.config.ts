import {vitePlugin as remix} from '@remix-run/dev';
import {defineConfig} from 'vite';
import tsconfigPaths from 'vite-tsconfig-paths';
import {flatRoutes} from 'remix-flat-routes';
import {envOnlyMacros} from 'vite-env-only';

export default defineConfig({
  plugins: [
    envOnlyMacros(),
    tsconfigPaths({root: './'}),
    remix({
      ignoredRouteFiles: ['**/*'],
      serverModuleFormat: 'esm',
      routes: async (defineRoutes) => {
        return flatRoutes('routes', defineRoutes, {
          ignoredRouteFiles: ['**/*.test.{js,jsx,ts,tsx}', '**/__*.*'],
        });
      },
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
  ],
  optimizeDeps: {
    entries: ['./app/entry.client.tsx', './app/root.tsx', './app/routes/**/*'],
  },
});
