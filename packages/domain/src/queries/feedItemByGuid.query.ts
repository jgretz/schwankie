import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {eq} from 'drizzle-orm';
import {Schema} from 'database';

interface FeedItemByGuidQuery {
  guid: string;
}

function query({database}: DomainDependencies) {
  return async function ({guid}: FeedItemByGuidQuery) {
    return await database.query.feedItem.findFirst({
      where: eq(Schema.feedItem.guid, guid),
    });
  };
}

export const feedItemByGuidQuery = InjectIn(query);
