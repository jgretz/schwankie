import z from 'zod';
import {parseEnv} from 'env';
import {createDatabase} from 'database';
import {enrichContent} from './jobs/enrich-content';
import {normalizeTags} from './jobs/normalize-tags';

const envSchema = z.object({
  DATABASE_URL: z.string(),
  CF_BROWSER_RENDERING_URL: z.string().optional(),
  OLLAMA_URL: z.string().optional(),
  OLLAMA_MODEL: z.string().default('llama3.2:3b'),
  POLL_INTERVAL_MS: z.coerce.number().default(60_000),
});
const env = parseEnv(envSchema);

const db = createDatabase(env.DATABASE_URL);

async function poll() {
  if (env.CF_BROWSER_RENDERING_URL) {
    await enrichContent(db, env.CF_BROWSER_RENDERING_URL);
  } else {
    console.log('[poll] CF_BROWSER_RENDERING_URL not set, skipping enrichment');
  }

  if (env.OLLAMA_URL) {
    await normalizeTags(db, env.OLLAMA_URL, env.OLLAMA_MODEL);
  } else {
    console.log('[poll] OLLAMA_URL not set, skipping tag normalization');
  }
}

let intervalId: ReturnType<typeof setInterval>;

function shutdown() {
  console.log('schwankie-tasks shutting down...');
  clearInterval(intervalId);
  process.exit(0);
}

async function start() {
  console.log('schwankie-tasks starting...');

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  intervalId = setInterval(poll, env.POLL_INTERVAL_MS);
  await poll();

  console.log(`Task runner started, polling every ${env.POLL_INTERVAL_MS}ms`);
}

start().catch(console.error);
