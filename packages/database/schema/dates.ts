import {timestamp} from 'drizzle-orm/pg-core';

export const dates = {
  createDate: timestamp('create_date', {precision: 6, mode: 'string'}).notNull(),
  updateDate: timestamp('update_date', {precision: 6, mode: 'string'}).notNull(),
};
