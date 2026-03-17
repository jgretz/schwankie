import z from 'zod';
import {parseEnv} from 'env';
import {createApiClient} from './lib/api-client';
import {enrichContent} from './jobs/enrich-content';
import {normalizeTags} from './jobs/normalize-tags';

const envSchema = z.object({
  API_URL: z.string().url(),
  API_KEY: z.string(),
  POLL_INTERVAL_MS: z.coerce.number().default(60_000),
  OLLAMA_URL: z.string().url().optional(),
  OLLAMA_MODEL: z.string().default('llama3.2:3b'),
  CF_BROWSER_RENDERING_URL: z.string().url().optional(),
});
const env = parseEnv(envSchema);

const api = createApiClient({apiUrl: env.API_URL, apiKey: env.API_KEY});

async function poll() {
  if (env.CF_BROWSER_RENDERING_URL) {
    await enrichContent(api, env.CF_BROWSER_RENDERING_URL);
  } else {
    console.log('[poll] CF_BROWSER_RENDERING_URL not set, skipping enrichment');
  }

  if (env.OLLAMA_URL) {
    await normalizeTags(api, env.OLLAMA_URL, env.OLLAMA_MODEL);
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
