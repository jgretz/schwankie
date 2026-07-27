import {
  date,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

/** One clustered theme within a digest, as produced by the generator sequence. */
export type DigestTopic = {
  rank: number;
  title: string;
  body: string;
  itemCount: number;
  links: Array<{url: string; title: string; source: string}>;
};

/**
 * One row per digest day. `summary_date` is the LOCAL calendar date the digest
 * was generated for (see DIGEST_TZ in packages/domain), while the window bounds
 * are absolute instants — the two are deliberately independent.
 *
 * Topics are denormalised into jsonb because they are only ever read as a whole
 * digest; normalising into a child table stays a contained change if that ever
 * stops being true.
 */
export const dailySummary = pgTable(
  'daily_summary',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    summaryDate: date('summary_date').notNull(),
    lookbackHours: integer('lookback_hours').notNull(),
    windowStart: timestamp('window_start', {precision: 6, withTimezone: true}).notNull(),
    windowEnd: timestamp('window_end', {precision: 6, withTimezone: true}).notNull(),
    itemCount: integer('item_count').notNull().default(0),
    notable: text('notable'),
    topics: jsonb('topics').$type<DigestTopic[]>().notNull().default([]),
    createdAt: timestamp('created_at', {precision: 6, withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', {precision: 6, withTimezone: true}).notNull().defaultNow(),
  },
  (table) => ({
    summaryDateIdx: uniqueIndex('idx_daily_summary_summary_date').on(table.summaryDate),
  }),
);
