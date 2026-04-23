import {hostname} from 'os';
import z from 'zod';
import PgBoss from 'pg-boss';
import {parseEnv} from 'env';
import {init} from 'client';
import {enrichContentHandler} from './jobs/enrich-content';
import {scoreLinksHandler} from './jobs/score-links';
import {normalizeTagsHandler} from './jobs/normalize-tags';
import {importFeedHandler} from './jobs/import-feed';
import {createScheduleFeedImportsHandler} from './jobs/schedule-feed-imports';
import {importEmailsHandler} from './jobs/import-emails';
import {createProcessWorkRequestsHandler} from './jobs/process-work-requests';
import {cleanupWorkRequestsHandler} from './jobs/cleanup-work-requests';
import {startHealthServer} from './healthCheck';
import {runWithAutoRecovery} from './connectionManager';

const envSchema = z.object({
  API_URL: z.string().url(),
  API_KEY: z.string(),
  PGBOSS_DATABASE_URL: z.string().url().optional(),
  PG_POOL_SIZE: z.coerce.number().default(10),
  WORKER_ID: z.string().optional(),
  OLLAMA_URL: z.string().url().optional(),
  OLLAMA_MODEL: z.string().default('llama3.2:3b'),
  OLLAMA_SCORE_HIGH: z.coerce.number().default(4),
  OLLAMA_SCORE_LOW: z.coerce.number().default(-2),
});
const env = parseEnv(envSchema);

init({apiUrl: env.API_URL, apiKey: env.API_KEY});

interface JobDefinition {
  queue: string;
  schedule: string;
}

const jobDefinitions: JobDefinition[] = [
  {queue: 'enrich-content', schedule: '*/1 * * * *'},
  {queue: 'score-links', schedule: '*/2 * * * *'},
  {queue: 'normalize-tags', schedule: '*/5 * * * *'},
  {queue: 'import-feed', schedule: ''},
  {queue: 'schedule-feed-imports', schedule: '*/30 * * * *'},
  {queue: 'import-emails', schedule: '0 * * * *'},
  {queue: 'process-work-requests', schedule: '*/5 * * * *'},
  {queue: 'cleanup-work-requests', schedule: '0 4 * * *'},
];

async function setupWorkers(boss: PgBoss): Promise<void> {
  const handlers: Record<string, PgBoss.WorkHandler<unknown>> = {
    'enrich-content': enrichContentHandler,
    'score-links': scoreLinksHandler,
    'normalize-tags': normalizeTagsHandler,
    'import-feed': importFeedHandler as PgBoss.WorkHandler<unknown>,
    'schedule-feed-imports': createScheduleFeedImportsHandler(boss),
    'import-emails': importEmailsHandler as PgBoss.WorkHandler<unknown>,
    'process-work-requests': createProcessWorkRequestsHandler(boss),
    'cleanup-work-requests': cleanupWorkRequestsHandler,
  };

  for (const {queue, schedule} of jobDefinitions) {
    await boss.createQueue(queue);
    if (schedule) {
      await boss.schedule(queue, schedule);
    }
    const handler = handlers[queue];
    await boss.work(queue, handler);
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
