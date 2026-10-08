import {rssItem} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';
import type {RssItem} from '../types';

export async function markRssItemRead(id: string): Promise<RssItem | null> {
  const db = getDb();

  const [updated] = await db
    .update(rssItem)
    .set({read: true})
    .where(eq(rssItem.id, id))
    .returning();

  return updated || null;
}
