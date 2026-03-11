import {index, pgTable, serial, text, varchar} from 'drizzle-orm/pg-core';

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
    ...dates,
  },
  (table) => [
    index('idx_link_status').on(table.status),
    index('idx_link_create_date').on(table.createDate),
  ],
);
