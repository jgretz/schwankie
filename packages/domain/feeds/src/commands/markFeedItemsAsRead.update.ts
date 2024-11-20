import {InjectIn} from 'injectx';
import {Schema} from 'database';
import {and, lte, eq} from 'drizzle-orm';
import type {FeedsDomainDependencies} from '../Types';

function command({database}: FeedsDomainDependencies) {
  return async function (mostRecentId: number) {
    return database
      .update(Schema.feedItem)
      .set({read: true})
      .where(and(lte(Schema.feedItem.id, mostRecentId), eq(Schema.feedItem.read, false)));
  };
}

export const markFeedItemsAsRead = InjectIn(command);
