import {index, integer, pgTable, serial, text, varchar} from 'drizzle-orm/pg-core';

import {dates, linkStatusEnum} from './helpers';

export const link = pgTable(
  'link',
  {
    id: serial('id').primaryKey(),
    url: varchar('url', {length: 2048}).notNull(),
    title: varchar('title', {length: 500}).notNull(),
    description: varchar('description', {length: 800}),
    imageUrl: varchar('image_url', {length: 2048}),
    status: linkStatusEnum('status').notNull().default('saved'),
    content: text('content'),
    enrichmentFailCount: integer('enrichment_fail_count').notNull().default(0),
    enrichmentLastError: varchar('enrichment_last_error', {length: 500}),
    ...dates,
  },
  (table) => ({
    statusIdx: index('idx_link_status').on(table.status),
    createDateIdx: index('idx_link_create_date').on(table.createDate),
  }),
);
