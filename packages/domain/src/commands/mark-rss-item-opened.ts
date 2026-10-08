import {rssItem} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';
import type {RssItem} from '../types';

// Opening an item implies reading it, so both are set together.
export async function markRssItemOpened(id: string): Promise<RssItem | null> {
  const db = getDb();

  const [updated] = await db
    .update(rssItem)
    .set({read: true, openedAt: new Date()})
    .where(eq(rssItem.id, id))
    .returning();

  return updated ?? null;
}
