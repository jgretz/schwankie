import {fileURLToPath} from 'node:url';
import {config} from 'dotenv';
import {defineConfig} from 'drizzle-kit';

// Single source of truth for DATABASE_URL is apps/api/.env (Neon).
// drizzle-kit runs from packages/database/, so load the api env explicitly.
config({path: fileURLToPath(new URL('../../apps/api/.env', import.meta.url))});

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL not set — expected it in apps/api/.env');
}

export default defineConfig({
  schema: './schema/*.schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
