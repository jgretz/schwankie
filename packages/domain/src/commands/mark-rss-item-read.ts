import {rssItem} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';
import type {RssItem} from '../types';

export async function markRssItemRead(id: string, clicked?: boolean): Promise<RssItem | null> {
  const db = getDb();

  const updateValues = {
    read: true,
    ...(clicked !== undefined && {clicked}),
  };

  const [updated] = await db
    .update(rssItem)
    .set(updateValues)
    .where(eq(rssItem.id, id))
    .returning();

  return updated || null;
}
