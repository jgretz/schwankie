import {pgTable, serial, varchar, foreignKey, integer} from 'drizzle-orm/pg-core';
import {dates} from './dates';

export const link = pgTable('link', {
  id: serial().primaryKey().notNull(),
  url: varchar({length: 2048}).notNull(),
  title: varchar({length: 500}).notNull(),
  description: varchar({length: 800}),
  imageUrl: varchar('image_url', {length: 2048}),

  ...dates,
});

export const tag = pgTable('tag', {
  id: serial().primaryKey().notNull(),
  text: varchar({length: 80}).notNull(),

  ...dates,
});

export const linkTag = pgTable(
  'link_tag',
  {
    id: serial().primaryKey().notNull(),
    linkId: integer('link_id').notNull(),
    tagId: integer('tag_id').notNull(),

    ...dates,
  },
  (table) => {
    return {
      linkTagLinkIdFkey: foreignKey({
        columns: [table.linkId],
        foreignColumns: [link.id],
        name: 'link_tag_link_id_fkey',
      })
        .onUpdate('cascade')
        .onDelete('restrict'),
      linkTagTagIdFkey: foreignKey({
        columns: [table.tagId],
        foreignColumns: [tag.id],
        name: 'link_tag_tag_id_fkey',
      })
        .onUpdate('cascade')
        .onDelete('restrict'),
    };
  },
);
