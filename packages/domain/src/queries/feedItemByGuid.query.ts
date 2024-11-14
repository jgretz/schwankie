import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {and, eq, inArray} from 'drizzle-orm';
import {Schema} from 'database';

interface ExistingFeedItemQuery {
  guids: string[];
  feedId: number;
}

function query({database}: DomainDependencies) {
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
