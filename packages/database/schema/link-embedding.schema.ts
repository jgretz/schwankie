import {
  customType,
  index,
  integer,
  pgTable,
  serial,
  timestamp,
  uniqueIndex,
  varchar,
} from 'drizzle-orm/pg-core';

import {link} from './link.schema';

const vector = customType<{
  data: number[];
  driverData: string;
  config: {dimensions: number};
  configRequired: true;
}>({
  dataType(config) {
    return `vector(${config!.dimensions})`;
  },
  toDriver(value: number[]): string {
    return `[${value.join(',')}]`;
  },
  fromDriver(value: string): number[] {
    if (!value) return [];
    return value.startsWith('[') ? JSON.parse(value) : [];
  },
});

export const linkEmbedding = pgTable(
  'link_embedding',
  {
    id: serial('id').primaryKey(),
    linkId: integer('link_id')
      .notNull()
      .references(() => link.id, {onDelete: 'cascade'}),
    embedding: vector('embedding', {dimensions: 768}).notNull(),
    model: varchar('model', {length: 100}).notNull(),
    computedAt: timestamp('computed_at', {precision: 6, withTimezone: true}).notNull().defaultNow(),
  },
  (table) => ({
    linkIdIdx: uniqueIndex('idx_link_embedding_link_id').on(table.linkId),
    modelIdx: index('idx_link_embedding_model').on(table.model),
    // NOTE: an HNSW cosine index (idx_link_embedding_hnsw) on `embedding` is
    // created via a custom migration — drizzle-orm 0.30 can't express pgvector
    // operator classes in the schema. It backs the <=> similarity scans in
    // scoreQueuedBySimilarity and getRelatedByVector.
  }),
);
