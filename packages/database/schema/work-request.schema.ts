import {index, jsonb, pgTable, text, timestamp, uuid} from 'drizzle-orm/pg-core';

export const workRequest = pgTable(
  'work_request',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    type: text('type').notNull(),
    payload: jsonb('payload').notNull().default({}),
    status: text('status').notNull().default('pending'),
    errorMessage: text('error_message'),
    createdAt: timestamp('created_at', {precision: 6, withTimezone: true}).notNull().defaultNow(),
    startedAt: timestamp('started_at', {precision: 6, withTimezone: true}),
    completedAt: timestamp('completed_at', {precision: 6, withTimezone: true}),
  },
  (table) => ({
    statusCreatedAtIdx: index('idx_work_request_status_created_at').on(table.status, table.createdAt),
  }),
);
