import {json, pgTable, serial, varchar} from 'drizzle-orm/pg-core';

export const google = pgTable('google', {
  id: serial().primaryKey().notNull(),
  email: varchar({length: 500}).notNull(),
  tokens: json().$type<string>().notNull(),
});
