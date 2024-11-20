import {Schema, type Database} from 'database';
import {createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

export const FeedsDomainDependencyEnv = z.object({
  DATABASE_URL: z.string(),
});

export const DATABASE = 'database';

export interface FeedsDomainDependencies {
  [DATABASE]: Database;
}

const selectFeedSchema = createSelectSchema(Schema.feed);
export type Feed = z.infer<typeof selectFeedSchema>;

const selectFeedItemSchema = createSelectSchema(Schema.feedItem);
export type FeedItem = z.infer<typeof selectFeedItemSchema>;

const selectFeedImportHistorySchema = createSelectSchema(Schema.feedImportHistory);
export type FeedImportHistory = z.infer<typeof selectFeedImportHistorySchema>;
