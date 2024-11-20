import {InjectIn} from 'injectx';
import type {FeedsDomainDependencies} from '../Types';
import {Schema} from 'database';
import {desc, eq} from 'drizzle-orm';

function query({database}: FeedsDomainDependencies) {
  return async function () {
    const unreadCount = await database.$count(Schema.feedItem, eq(Schema.feedItem.read, false));
    const lastUpdate = await database.query.feedImportHistory.findFirst({
      columns: {
        importDate: true,
      },
      orderBy: desc(Schema.feedImportHistory.importDate),
    });

    return {
      unreadCount,
      lastUpdate: lastUpdate?.importDate,
    };
  };
}

export const feedStatsQuery = InjectIn(query);
