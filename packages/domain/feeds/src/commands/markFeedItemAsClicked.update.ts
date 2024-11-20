import {InjectIn} from 'injectx';
import {Schema} from 'database';
import {eq} from 'drizzle-orm';
import type {FeedsDomainDependencies} from '../Types';

function command({database}: FeedsDomainDependencies) {
  return async function (id: number) {
    return database.update(Schema.feedItem).set({clicked: true}).where(eq(Schema.feedItem.id, id));
  };
}

export const markFeedItemAsClicked = InjectIn(command);
