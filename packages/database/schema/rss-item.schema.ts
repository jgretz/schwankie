import {boolean, index, pgTable, text, timestamp, uniqueIndex, uuid} from 'drizzle-orm/pg-core';

import {feed} from './feed.schema';

export const rssItem = pgTable(
  'rss_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    feedId: uuid('feed_id')
      .notNull()
      .references(() => feed.id, {onDelete: 'cascade'}),
    guid: text('guid').notNull(),
    title: text('title').notNull(),
    link: text('link').notNull(),
    summary: text('summary'),
    content: text('content'),
    imageUrl: text('image_url'),
    publishedAt: timestamp('published_at', {withTimezone: true}),
    read: boolean('read').notNull().default(false),
    clicked: boolean('clicked').notNull().default(false),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => ({
    feedGuidIdx: uniqueIndex('idx_rss_item_feed_guid').on(table.feedId, table.guid),
    readPublishedIdx: index('idx_rss_item_read_published').on(table.read, table.publishedAt),
  }),
);
