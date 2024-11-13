import {Schema} from 'database';
import type {DomainDependencies} from '../Types';
import {InjectIn} from 'injectx';

type FeedItemInsert = typeof Schema.feedItem.$inferInsert;

function command({database}: DomainDependencies) {
  return async function (items: FeedItemInsert[]) {
    return database.insert(Schema.feedItem).values(items);
  };
}

export const feedItemBulkInsert = InjectIn(command);
