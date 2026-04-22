import {feed} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';

export async function getFeed(id: string) {
  const db = getDb();

  const [foundFeed] = await db.select().from(feed).where(eq(feed.id, id));

  return foundFeed || null;
}
