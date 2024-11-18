import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {Schema} from 'database';
import {eq} from 'drizzle-orm';

function command({database}: DomainDependencies) {
  return async function (id: number) {
    return database.update(Schema.feedItem).set({clicked: true}).where(eq(Schema.feedItem.id, id));
  };
}

export const markFeedItemAsClicked = InjectIn(command);
