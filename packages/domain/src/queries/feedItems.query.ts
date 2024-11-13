import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {and, eq} from 'drizzle-orm';
import {Schema} from 'database';
import {match} from 'ts-pattern';

interface FeedItemQuery {
  page: number;
  size: number;
  includeRead?: boolean;
  feedId?: number;
}

function query({database}: DomainDependencies) {
  return async function ({page, size, feedId, includeRead}: FeedItemQuery) {
    const clauses: Array<ReturnType<typeof eq>> = [];
    if (feedId) {
      clauses.push(eq(Schema.feedItem.feedId, feedId));
    }
    if (includeRead) {
      clauses.push(eq(Schema.feedItem.read, includeRead));
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
