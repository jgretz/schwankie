import {InjectIn} from 'injectx';
import {eq} from 'drizzle-orm';
import {Schema} from 'database';
import type {FeedsDomainDependencies} from '../Types';

function query({database}: FeedsDomainDependencies) {
  return async function ({id}: {id: number}) {
    return await database.query.feed.findFirst({
      where: eq(Schema.feedItem.id, id),
    });
  };
}

export const feedByIdQuery = InjectIn(query);
