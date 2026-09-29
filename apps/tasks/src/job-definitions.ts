import type PgBoss from 'pg-boss';

import {BURST_CRON} from './lib/burst-schedule';

export interface JobDefinition {
  queue: string;
  schedule: string;
  runOnBoot?: boolean;
  options?: PgBoss.WorkOptions;
}

// Scheduler crons fire every 45 min (':0' and ':45') so Neon stays quiet
// between bursts, and the runner heartbeat rides the same burst clock. Content
// is read 2-3x/day, so up-to-45-min enrich/score latency is fine. Tune upward
// (e.g. hourly) if Neon usage allows. process-work-requests is the one
// off-burst cron: its hinted poll is answered from API memory and reaches Neon
// only after a refresh was requested. See docs/neon-idle-cadence.md.
export const jobDefinitions: JobDefinition[] = [
  {queue: 'schedule-enrich-content', schedule: BURST_CRON},
  {queue: 'enrich-link', schedule: '', options: {batchSize: 5}},
  {queue: 'schedule-compute-embeddings', schedule: BURST_CRON},
  {queue: 'embed-link', schedule: '', options: {batchSize: 5}},
  {queue: 'schedule-score-links', schedule: BURST_CRON},
  {queue: 'score-link', schedule: '', options: {batchSize: 10}},
  {queue: 'schedule-normalize-tags', schedule: BURST_CRON},
  {queue: 'normalize-tag-chunk', schedule: '', options: {batchSize: 1}},
  {queue: 'import-feed', schedule: '', options: {batchSize: 50}},
  {queue: 'schedule-feed-imports', schedule: BURST_CRON},
  {queue: 'schedule-import-emails', schedule: BURST_CRON},
  {queue: 'import-email-message', schedule: '', options: {batchSize: 5}},
  {queue: 'process-work-requests', schedule: '*/5 * * * *'},
  {queue: 'sweep-work-requests', schedule: BURST_CRON, runOnBoot: true},
  {queue: 'cleanup-work-requests', schedule: '0 4 * * *'},
  {queue: 'cleanup-runners', schedule: '0 5 * * *'},
];
