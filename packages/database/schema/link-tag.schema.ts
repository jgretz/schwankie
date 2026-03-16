import {index, integer, pgTable, serial, timestamp, uniqueIndex} from 'drizzle-orm/pg-core';

import {link} from './link.schema';
import {tag} from './tag.schema';

export const linkTag = pgTable(
  'link_tag',
  {
    id: serial('id').primaryKey(),
    linkId: integer('link_id')
      .notNull()
      .references(() => link.id, {onDelete: 'cascade'}),
    tagId: integer('tag_id')
      .notNull()
      .references(() => tag.id, {onDelete: 'cascade'}),
    createDate: timestamp('create_date', {precision: 6, withTimezone: true}).notNull().defaultNow(),
  },
  (table) => ({
    linkIdIdx: index('idx_link_tag_link_id').on(table.linkId),
    tagIdIdx: index('idx_link_tag_tag_id').on(table.tagId),
    uniqueIdx: uniqueIndex('idx_link_tag_unique').on(table.linkId, table.tagId),
  }),
);
