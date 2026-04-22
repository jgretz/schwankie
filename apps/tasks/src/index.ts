import {hostname} from 'os';
import z from 'zod';
import PgBoss from 'pg-boss';
import {parseEnv} from 'env';
import {init} from 'client';
import {enrichContentHandler} from './jobs/enrich-content';
import {scoreLinksHandler} from './jobs/score-links';
import {normalizeTagsHandler} from './jobs/normalize-tags';
import {importFeedHandler} from './jobs/import-feed';
import {scheduleFeedImportsHandler} from './jobs/schedule-feed-imports';
import {startHealthServer} from './healthCheck';
import {runWithAutoRecovery} from './connectionManager';

const envSchema = z.object({
  API_URL: z.string().url(),
  API_KEY: z.string(),
  PGBOSS_DATABASE_URL: z.string().url(),
  PG_POOL_SIZE: z.coerce.number().default(10),
  WORKER_ID: z.string().optional(),
  OLLAMA_URL: z.string().url().optional(),
  OLLAMA_MODEL: z.string().default('llama3.2:3b'),
});
const env = parseEnv(envSchema);

init({apiUrl: env.API_URL, apiKey: env.API_KEY});

interface JobDefinition {
  queue: string;
  schedule: string;
  handler: PgBoss.WorkHandler<unknown>;
}

const jobDefinitions: JobDefinition[] = [
  {queue: 'enrich-content', schedule: '*/1 * * * *', handler: enrichContentHandler},
  {queue: 'score-links', schedule: '*/2 * * * *', handler: scoreLinksHandler},
  {queue: 'normalize-tags', schedule: '*/5 * * * *', handler: normalizeTagsHandler},
  {queue: 'import-feed', schedule: '', handler: importFeedHandler as PgBoss.WorkHandler<unknown>},
  {queue: 'schedule-feed-imports', schedule: '*/30 * * * *', handler: scheduleFeedImportsHandler as PgBoss.WorkHandler<unknown>},
];

async function setupWorkers(boss: PgBoss): Promise<void> {
  for (const {queue, schedule, handler} of jobDefinitions) {
    await boss.createQueue(queue);
    if (schedule) {
      await boss.schedule(queue, schedule);
    }
    await boss.work(queue, handler as PgBoss.WorkHandler<unknown>);
    console.log(`Registered: ${queue}${schedule ? ` (${schedule})` : ''}`);
  }
  console.log('Task runner started successfully');
}

async function main(): Promise<void> {
  const workerId = env.WORKER_ID || hostname();
  process.env.WORKER_ID = workerId;
  console.log(`Starting schwankie task runner (worker: ${workerId})...`);

  startHealthServer();

  await runWithAutoRecovery(setupWorkers);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
