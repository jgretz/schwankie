import {index, integer, pgTable, serial, timestamp, varchar} from 'drizzle-orm/pg-core';

import {tag} from './tag.schema';

export const tagAlias = pgTable(
  'tag_alias',
  {
    id: serial('id').primaryKey(),
    aliasText: varchar('alias_text', {length: 200}).notNull(),
    canonicalTagId: integer('canonical_tag_id')
      .notNull()
      .references(() => tag.id, {onDelete: 'restrict'}),
    source: varchar('source', {length: 20}).notNull(),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
  },
  (table) => [
    index('idx_tag_alias_canonical').on(table.canonicalTagId),
    index('idx_tag_alias_source').on(table.source),
  ],
);
