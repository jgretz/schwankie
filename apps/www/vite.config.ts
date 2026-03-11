import {tanstackStart} from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';
import tsConfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  server: {port: 3000},
  plugins: [
    tsConfigPaths({ignoreConfigErrors: true}),
    // @ts-expect-error - customViteReactPlugin prevents infinite vite.config.timestamp files
    tanstackStart({customViteReactPlugin: true}),
    react(),
  ],
});
