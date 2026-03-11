import z from 'zod';
import {parseEnv} from 'env';

const envSchema = z.object({
  POLL_INTERVAL_MS: z.coerce.number().default(60_000),
});
const env = parseEnv(envSchema);

async function poll() {
  console.log('Polling for tasks...');
}

async function start() {
  console.log('schwankie-tasks starting...');

  setInterval(poll, env.POLL_INTERVAL_MS);
  await poll();

  console.log(`Task runner started, polling every ${env.POLL_INTERVAL_MS}ms`);
}

start().catch(console.error);
