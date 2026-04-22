import {boolean, pgTable, text, timestamp, uniqueIndex, uuid} from 'drizzle-orm/pg-core';

export const emailItem = pgTable(
  'email_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    emailMessageId: text('email_message_id').notNull(),
    emailFrom: text('email_from').notNull(),
    link: text('link').notNull(),
    title: text('title'),
    description: text('description'),
    read: boolean('read').notNull().default(false),
    clicked: boolean('clicked').notNull().default(false),
    importedAt: timestamp('imported_at', {precision: 6, withTimezone: true}).notNull().defaultNow(),
  },
  (table) => ({
    emailItemMessageLinkUnique: uniqueIndex('email_item_message_link_unique').on(table.emailMessageId, table.link),
  }),
);
