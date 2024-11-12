import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {eq} from 'drizzle-orm';
import {Schema} from 'database';

function query({database}: DomainDependencies) {
  return async function () {
    return await database.query.feed.findMany({
      // where: eq(Schema.feed.id, 12),
    });
  };
}

export const feedsQuery = InjectIn(query);
