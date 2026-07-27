import {eq} from 'drizzle-orm';
import {rssItem} from 'database';
import {getDb} from '../db';
import type {RssItem} from '../types';

export async function getRssItem(id: string): Promise<RssItem | null> {
  const db = getDb();

  const [item] = await db.select().from(rssItem).where(eq(rssItem.id, id));

  return item ?? null;
}
