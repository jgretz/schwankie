import {InjectIn} from 'injectx';
import {and, eq} from 'drizzle-orm';
import {Schema} from 'database';
import {match} from 'ts-pattern';
import type {FeedsDomainDependencies} from '../Types';

interface FeedItemQuery {
  page: number;
  size: number;
  includeRead: boolean;
  feedId?: number;
}

function query({database}: FeedsDomainDependencies) {
  return async function ({page, size, feedId, includeRead}: FeedItemQuery) {
    const clauses: Array<ReturnType<typeof eq>> = [];
    clauses.push(eq(Schema.feedItem.read, includeRead));

    if (feedId) {
      clauses.push(eq(Schema.feedItem.feedId, feedId));
    }

    const where = match(clauses.length)
      .with(2, () => and(...clauses))
      .with(1, () => clauses[0])
      .otherwise(() => undefined);

    return await database.query.feedItem.findMany({
      limit: size,
      offset: page * size,
      orderBy: (link, {desc}) => [desc(link.updateDate)],
      where,
    });
  };
}

export const feedItemsQuery = InjectIn(query);
