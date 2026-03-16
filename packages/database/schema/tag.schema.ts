import {pgTable, serial, timestamp, uniqueIndex, varchar} from 'drizzle-orm/pg-core';

import {dates} from './helpers';

export const tag = pgTable(
  'tag',
  {
    id: serial('id').primaryKey(),
    text: varchar('text', {length: 200}).notNull().unique(),
    normalizedAt: timestamp('normalized_at', {withTimezone: true}),
    ...dates,
  },
  (table) => [uniqueIndex('idx_tag_text').on(table.text)],
);
