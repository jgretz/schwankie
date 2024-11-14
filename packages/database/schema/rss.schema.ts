import {boolean, index, pgTable, serial, text, timestamp, varchar} from 'drizzle-orm/pg-core';
import {dates} from './dates';

export const feed = pgTable('feed', {
  id: serial().primaryKey().notNull(),
  title: varchar({length: 500}).notNull(),
  feedUrl: varchar({length: 2048}).notNull(),
  siteUrl: varchar({length: 2048}).notNull(),

  ...dates,
});

export const feedItem = pgTable(
  'feed_item',
  {
    id: serial().primaryKey().notNull(),
    feedId: serial()
      .notNull()
      .references(() => feed.id),
    guid: varchar({length: 500}).notNull(),
    content: text().notNull(),
    read: boolean().default(false).notNull(),

    ...dates,
  },
  (table) => {
    return {
      existingIdx: index('existing_idx').on(table.feedId, table.guid),
    };
  },
);

export const feedStats = pgTable('feed_stats', {
  id: serial().primaryKey().notNull(),
  lastLoad: timestamp('last_load', {precision: 6, mode: 'string'}).notNull(),
});
