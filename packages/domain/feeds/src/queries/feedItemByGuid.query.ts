import {InjectIn} from 'injectx';
import {and, eq, inArray} from 'drizzle-orm';
import {Schema} from 'database';
import type {FeedsDomainDependencies} from '../Types';

interface ExistingFeedItemQuery {
  guids: string[];
  feedId: number;
}

function query({database}: FeedsDomainDependencies) {
  return async function ({guids, feedId}: ExistingFeedItemQuery) {
    return await database.query.feedItem.findMany({
      columns: {
        guid: true,
      },
      where: and(eq(Schema.feedItem.feedId, feedId), inArray(Schema.feedItem.guid, guids)),
    });
  };
}

export const existingFeedItemQuery = InjectIn(query);
