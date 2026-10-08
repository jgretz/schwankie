import {boolean, index, pgTable, text, timestamp, uniqueIndex, uuid} from 'drizzle-orm/pg-core';

export const emailItem = pgTable(
  'email_item',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    emailMessageId: text('email_message_id').notNull(),
    emailFrom: text('email_from').notNull(),
    // Nullable: rows ingested before the sender/subject split carry no subject.
    emailSubject: text('email_subject'),
    link: text('link').notNull(),
    title: text('title'),
    description: text('description'),
    read: boolean('read').notNull().default(false),
    // Set by promote only: the item was saved to the link queue.
    promoted: boolean('promoted').notNull().default(false),
    // Last time the item's link was opened from a schwankie reader. Null when never opened.
    openedAt: timestamp('opened_at', {precision: 6, withTimezone: true}),
    importedAt: timestamp('imported_at', {precision: 6, withTimezone: true}).notNull().defaultNow(),
  },
  (table) => ({
    emailItemMessageLinkUnique: uniqueIndex('email_item_message_link_unique').on(
      table.emailMessageId,
      table.link,
    ),
    // The digest window filters on imported_at; email items carry no published date.
    importedAtIdx: index('idx_email_item_imported_at').on(table.importedAt),
  }),
);
