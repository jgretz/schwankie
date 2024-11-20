import {Schema} from 'database';
import {InjectIn} from 'injectx';
import type {FeedsDomainDependencies} from '../Types';

type FeedImportHistoryInsert = typeof Schema.feedImportHistory.$inferInsert;

function command({database}: FeedsDomainDependencies) {
  return async function (item: FeedImportHistoryInsert) {
    return database.insert(Schema.feedImportHistory).values(item);
  };
}

export const feedImportHistoryInsert = InjectIn(command);
