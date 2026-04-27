import {tanstackStart} from '@tanstack/react-start/plugin/vite';
import react from '@vitejs/plugin-react';
import {defineConfig} from 'vite';

const API_URL = process.env.VITE_API_URL ?? 'http://localhost:3001';

export default defineConfig({
  server: {
    port: 3000,
    proxy: {
      '/rss': {target: API_URL, changeOrigin: true, rewrite: () => '/api/rss'},
    },
  },
  resolve: {tsconfigPaths: true},
  plugins: [tanstackStart(), react()],
});
