import {Schema} from 'database';
import {InjectIn} from 'injectx';
import type {FeedsDomainDependencies} from '../Types';

type FeedItemInsert = typeof Schema.feedItem.$inferInsert;

function command({database}: FeedsDomainDependencies) {
  return async function (items: FeedItemInsert[]) {
    return database.insert(Schema.feedItem).values(items);
  };
}

export const feedItemBulkInsert = InjectIn(command);
