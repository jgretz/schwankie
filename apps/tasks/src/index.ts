import z from 'zod';
import {parseEnv} from 'env';
import {init} from 'client';
import {enrichContent} from './jobs/enrich-content';
import {normalizeTags} from './jobs/normalize-tags';

const envSchema = z.object({
  API_URL: z.string().url(),
  API_KEY: z.string(),
  POLL_INTERVAL_MS: z.coerce.number().default(60_000),
  OLLAMA_URL: z.string().url().optional(),
  OLLAMA_MODEL: z.string().default('llama3.2:3b'),
});
const env = parseEnv(envSchema);

init({apiUrl: env.API_URL, apiKey: env.API_KEY});

async function poll() {
  await enrichContent();

  if (env.OLLAMA_URL) {
    await normalizeTags(env.OLLAMA_URL, env.OLLAMA_MODEL);
  } else {
    console.log('[poll] OLLAMA_URL not set, skipping tag normalization');
  }
}

let timeoutId: ReturnType<typeof setTimeout>;
let running = true;

function shutdown() {
  console.log('schwankie-tasks shutting down...');
  running = false;
  clearTimeout(timeoutId);
  process.exit(0);
}

async function scheduleNext() {
  if (!running) return;
  await poll();
  if (running) {
    timeoutId = setTimeout(scheduleNext, env.POLL_INTERVAL_MS);
  }
}

async function start() {
  console.log('schwankie-tasks starting...');

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  await scheduleNext();
}

start().catch(console.error);
