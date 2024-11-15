import {InjectIn} from 'injectx';
import type {DomainDependencies} from '../Types';
import {Schema} from 'database';
import {eq} from 'drizzle-orm';

function command({database}: DomainDependencies) {
  return async function () {
    const unreadCount = await database.$count(Schema.feedItem, eq(Schema.feedItem.read, false));

    return database.update(Schema.feedStats).set({lastLoad: new Date(), unreadCount}).execute();
  };
}

export const updateFeedStats = InjectIn(command);
