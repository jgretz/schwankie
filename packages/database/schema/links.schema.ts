import {pgTable, serial, varchar, json} from 'drizzle-orm/pg-core';
import {dates} from './dates';

export const link = pgTable('link', {
  id: serial().primaryKey().notNull(),
  url: varchar({length: 2048}).notNull(),
  title: varchar({length: 500}).notNull(),
  description: varchar({length: 800}),
  imageUrl: varchar('image_url', {length: 2048}),

  tags: json().$type<string[]>().default([]),

  ...dates,
});
