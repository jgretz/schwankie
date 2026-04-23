import {rssItem} from 'database';
import {and, eq} from 'drizzle-orm';
import {getDb} from '../db';

export async function markAllRssItemsRead(params: {feedId?: string}): Promise<number> {
  const db = getDb();

  const conditions = [eq(rssItem.read, false)];
  if (params.feedId) conditions.push(eq(rssItem.feedId, params.feedId));

  const updated = await db
    .update(rssItem)
    .set({read: true})
    .where(and(...conditions))
    .returning({id: rssItem.id});

  return updated.length;
}
