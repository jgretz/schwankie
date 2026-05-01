import {hostname} from 'os';
import z from 'zod';
import PgBoss from 'pg-boss';
import {v7 as uuidv7} from 'uuid';
import {parseEnv} from 'env';
import {init, recordRunnerHeartbeat, upsertRunner} from 'client';
import {createScheduleEnrichContentHandler} from './jobs/schedule-enrich-content';
import {enrichLinkHandler} from './jobs/enrich-link';
import {createScheduleScoreLinksHandler} from './jobs/schedule-score-links';
import {scoreLinkHandler} from './jobs/score-link';
import {createScheduleComputeEmbeddingsHandler} from './jobs/schedule-compute-embeddings';
import {embedLinkHandler} from './jobs/embed-link';
import {createScheduleNormalizeTagsHandler} from './jobs/schedule-normalize-tags';
import {normalizeTagChunkHandler} from './jobs/normalize-tag-chunk';
import {importFeedHandler} from './jobs/import-feed';
import {createScheduleFeedImportsHandler} from './jobs/schedule-feed-imports';
import {createScheduleImportEmailsHandler} from './jobs/schedule-import-emails';
import {importEmailMessageHandler} from './jobs/import-email-message';
import {createProcessWorkRequestsHandler} from './jobs/process-work-requests';
import {cleanupWorkRequestsHandler} from './jobs/cleanup-work-requests';
import {heartbeatHandler} from './jobs/heartbeat';
import {cleanupRunnersHandler} from './jobs/cleanup-runners';
import {runWithAutoRecovery} from './connectionManager';

const envSchema = z.object({
  API_URL: z.string().url(),
  API_KEY: z.string(),
  PGBOSS_DATABASE_URL: z.string().url().optional(),
  PG_POOL_SIZE: z.coerce.number().default(10),
  OLLAMA_URL: z.string().url().optional(),
  OLLAMA_MODEL: z.string().default('llama3.2:3b'),
  OLLAMA_SCORE_HIGH: z.coerce.number().default(4),
  OLLAMA_SCORE_LOW: z.coerce.number().default(-2),
  OLLAMA_EMBED_MODEL: z.string().default('nomic-embed-text'),
});
const env = parseEnv(envSchema);

interface JobDefinition {
  queue: string;
  schedule: string;
  runOnBoot?: boolean;
  options?: PgBoss.WorkOptions;
}

const jobDefinitions: JobDefinition[] = [
  {queue: 'schedule-enrich-content', schedule: '* * * * *'},
  {queue: 'enrich-link', schedule: '', options: {batchSize: 5}},
  {queue: 'schedule-compute-embeddings', schedule: '*/15 * * * *'},
  {queue: 'embed-link', schedule: '', options: {batchSize: 5}},
  {queue: 'schedule-score-links', schedule: '*/2 * * * *'},
  {queue: 'score-link', schedule: '', options: {batchSize: 10}},
  {queue: 'schedule-normalize-tags', schedule: '*/5 * * * *'},
  {queue: 'normalize-tag-chunk', schedule: '', options: {batchSize: 1}},
  {queue: 'import-feed', schedule: '', options: {batchSize: 50}},
  {queue: 'schedule-feed-imports', schedule: '*/30 * * * *'},
  {queue: 'schedule-import-emails', schedule: '*/30 * * * *'},
  {queue: 'import-email-message', schedule: '', options: {batchSize: 5}},
  {queue: 'process-work-requests', schedule: '*/5 * * * *', runOnBoot: true},
  {queue: 'cleanup-work-requests', schedule: '0 4 * * *'},
  {queue: 'cleanup-runners', schedule: '0 5 * * *'},
  {queue: 'heartbeat', schedule: '* * * * *', runOnBoot: true},
];

async function setupWorkers(boss: PgBoss): Promise<void> {
  const handlers: Record<string, PgBoss.WorkHandler<unknown>> = {
    'schedule-enrich-content': createScheduleEnrichContentHandler(boss),
    'enrich-link': enrichLinkHandler as PgBoss.WorkHandler<unknown>,
    'schedule-compute-embeddings': createScheduleComputeEmbeddingsHandler(boss),
    'embed-link': embedLinkHandler as PgBoss.WorkHandler<unknown>,
    'schedule-score-links': createScheduleScoreLinksHandler(boss),
    'score-link': scoreLinkHandler as PgBoss.WorkHandler<unknown>,
    'schedule-normalize-tags': createScheduleNormalizeTagsHandler(boss),
    'normalize-tag-chunk': normalizeTagChunkHandler as PgBoss.WorkHandler<unknown>,
    'import-feed': importFeedHandler as PgBoss.WorkHandler<unknown>,
    'schedule-feed-imports': createScheduleFeedImportsHandler(boss),
    'schedule-import-emails': createScheduleImportEmailsHandler(boss),
    'import-email-message': importEmailMessageHandler as PgBoss.WorkHandler<unknown>,
    'process-work-requests': createProcessWorkRequestsHandler(boss),
    'cleanup-work-requests': cleanupWorkRequestsHandler,
    'cleanup-runners': cleanupRunnersHandler,
    heartbeat: heartbeatHandler,
  };

  for (const {queue, schedule, options} of jobDefinitions) {
    await boss.createQueue(queue);
    if (schedule) {
      await boss.schedule(queue, schedule);
    }
    const handler = handlers[queue];
    if (options) {
      await boss.work(queue, options, handler);
    } else {
      await boss.work(queue, handler);
    }
    console.log(`Registered: ${queue}${schedule ? ` (${schedule})` : ''}`);
  }

  for (const {queue, runOnBoot} of jobDefinitions) {
    if (runOnBoot) {
      await boss.send(queue, {});
      console.log(`Dispatched boot run: ${queue}`);
    }
  }

  console.log('Task runner started successfully');
}

async function main(): Promise<void> {
  const workerId = uuidv7();
  process.env.WORKER_ID = workerId;
  console.log(`Starting schwankie task runner (worker: ${workerId})...`);

  init({apiUrl: env.API_URL, apiKey: env.API_KEY});

  await upsertRunner({
    workerId,
    hostname: hostname(),
    pid: process.pid,
    version: process.env.GIT_SHA ?? null,
  });
  await recordRunnerHeartbeat(workerId);

  await runWithAutoRecovery(setupWorkers);
}

main().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});
