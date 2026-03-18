import { pgTable, text } from 'drizzle-orm/pg-core';

export const setting = pgTable('setting', {
  key: text('key').primaryKey(),
  value: text('value').notNull(),
});
