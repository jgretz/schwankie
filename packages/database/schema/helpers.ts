import {pgEnum, timestamp} from 'drizzle-orm/pg-core';

export const linkStatusEnum = pgEnum('link_status', ['queued', 'saved', 'archived', 'trashed']);
export type LinkStatus = (typeof linkStatusEnum.enumValues)[number];

export const dates = {
  createDate: timestamp('create_date', {precision: 6, withTimezone: true}).notNull().defaultNow(),
  updateDate: timestamp('update_date', {precision: 6, withTimezone: true}).notNull().defaultNow(),
};
