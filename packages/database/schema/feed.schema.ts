import {boolean, index, integer, pgTable, text, timestamp, uuid} from 'drizzle-orm/pg-core';

export const feed = pgTable(
  'feed',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    name: text('name').notNull(),
    sourceUrl: text('source_url').notNull().unique(),
    lastFetchedAt: timestamp('last_fetched_at', {withTimezone: true}),
    errorCount: integer('error_count').notNull().default(0),
    lastError: text('last_error'),
    disabled: boolean('disabled').notNull().default(false),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => ({
    disabledCreatedAtIdx: index('idx_feed_disabled_created_at').on(table.disabled, table.createdAt),
  }),
);
