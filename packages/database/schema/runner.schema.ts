import {index, integer, pgTable, text, timestamp} from 'drizzle-orm/pg-core';

export const runner = pgTable(
  'runner',
  {
    workerId: text('worker_id').primaryKey(),
    hostname: text('hostname').notNull(),
    pid: integer('pid').notNull(),
    version: text('version'),
    startedAt: timestamp('started_at', {withTimezone: true}).notNull().defaultNow(),
    lastHeartbeatAt: timestamp('last_heartbeat_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => ({
    heartbeatIdx: index('idx_runner_last_heartbeat_at').on(table.lastHeartbeatAt),
    hostPidIdx: index('idx_runner_host_pid').on(table.hostname, table.pid),
  }),
);
