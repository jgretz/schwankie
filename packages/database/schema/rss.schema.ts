import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  varchar,
} from 'drizzle-orm/pg-core';
import {dates} from './dates';

export const feed = pgTable('feed', {
  id: serial().primaryKey().notNull(),
  title: varchar({length: 500}).notNull(),
  feedUrl: varchar('feed_url', {length: 2048}).notNull(),
  siteUrl: varchar('site_url', {length: 2048}).notNull(),

  ...dates,
});

export const feedItem = pgTable(
  'feed_item',
  {
    id: serial().primaryKey().notNull(),
    feedId: serial('feed_id')
      .notNull()
      .references(() => feed.id),
    guid: varchar({length: 500}).notNull(),
    content: text().notNull(),
    read: boolean().default(false).notNull(),
    clicked: boolean().default(false).notNull(),

    ...dates,
  },
  (table) => {
    return {
      existingIdx: index('existing_idx').on(table.feedId, table.guid),
    };
  },
);

export const feedImportHistory = pgTable('feed_import_history', {
  id: serial().primaryKey().notNull(),
  feedId: serial('feed_id')
    .notNull()
    .references(() => feed.id),
  importDate: timestamp('import_date', {precision: 6, mode: 'date'}).notNull(),
  itemCount: integer('item_count').notNull(),
});
