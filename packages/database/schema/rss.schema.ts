import {boolean, pgTable, serial, varchar} from 'drizzle-orm/pg-core';
import {dates} from './dates';

export const feed = pgTable('feed', {
  id: serial().primaryKey().notNull(),
  title: varchar({length: 500}).notNull(),
  feedUrl: varchar({length: 2048}).notNull(),
  siteUrl: varchar({length: 2048}).notNull(),

  ...dates,
});

export const feedItem = pgTable('feed_item', {
  id: serial().primaryKey().notNull(),
  rss_guid: varchar({length: 500}).notNull(),
  read: boolean().default(false).notNull(),

  ...dates,
});
