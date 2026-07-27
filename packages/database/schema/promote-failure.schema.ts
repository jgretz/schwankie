import {index, pgTable, text, timestamp, uuid} from 'drizzle-orm/pg-core';

/**
 * Which ingestion table the promote was attempted from. The column stays plain
 * `text` (no pg enum), so this tuple is the single source of truth — the API
 * validator derives its `z.enum` from it rather than restating the literals.
 */
export const PROMOTE_FAILURE_SOURCES = ['rss', 'email'] as const;

export type PromoteFailureSource = (typeof PROMOTE_FAILURE_SOURCES)[number];

/**
 * One row per failed promote. Written from the API route's catch block, never
 * from inside the promote command — the command runs wholly inside a
 * transaction, so a row inserted there would be rolled away with the failure.
 *
 * `error_message` is unbounded on purpose: truncating it would recreate the
 * varchar-overflow class of bug this table exists to surface.
 */
export const promoteFailure = pgTable(
  'promote_failure',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    source: text('source').$type<PromoteFailureSource>().notNull(),
    sourceItemId: text('source_item_id').notNull(),
    /** Best-effort lookup of the source item; null when that lookup also failed. */
    url: text('url'),
    title: text('title'),
    errorMessage: text('error_message').notNull(),
    errorCode: text('error_code'),
    createdAt: timestamp('created_at', {precision: 6, withTimezone: true}).notNull().defaultNow(),
  },
  (table) => ({
    sourceCreatedAtIdx: index('idx_promote_failure_source_created_at').on(
      table.source,
      table.createdAt,
    ),
  }),
);
