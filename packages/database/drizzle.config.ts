import {defineConfig} from 'drizzle-kit';

export default defineConfig({
  schema: ['./schema/*.schema.ts'],
  dialect: 'postgresql',
  out: './drizzle/',
  dbCredentials: {
    url: process.env.DATABASE_URL || '',
  },
  verbose: true,
  strict: true,
});
