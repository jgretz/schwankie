import {Schema, type Database} from 'database';
import {createSelectSchema} from 'drizzle-zod';
import {z} from 'zod';

export const DomainDependencyEnv = z.object({
  DATABASE_URL: z.string(),
});

export const DATABASE = 'database';

export interface DomainDependencies {
  [DATABASE]: Database;
}

const selectLinkSchema = createSelectSchema(Schema.link);
export type Link = z.infer<typeof selectLinkSchema>;
export type Links = Link[];

const selectFeedSchema = createSelectSchema(Schema.feed);
export type Feed = z.infer<typeof selectFeedSchema>;

const selectFeedItemSchema = createSelectSchema(Schema.feedItem);
export type FeedItem = z.infer<typeof selectFeedItemSchema>;

const selectFeedStatsSchema = createSelectSchema(Schema.feedStats);
export type FeedStats = z.infer<typeof selectFeedStatsSchema>;
