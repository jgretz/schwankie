import {vitePlugin as remix} from '@remix-run/dev';
import {defineConfig} from 'vite';
import envOnly from 'vite-env-only';
import tsconfigPaths from 'vite-tsconfig-paths';
import {flatRoutes} from 'remix-flat-routes';

export default defineConfig({
  plugins: [
    envOnly(),
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
});
