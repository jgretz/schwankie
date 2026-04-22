import {feed} from 'database';
import {eq} from 'drizzle-orm';
import {getDb} from '../db';

export async function deleteFeed(id: string): Promise<boolean> {
  const db = getDb();
  const [deleted] = await db.delete(feed).where(eq(feed.id, id)).returning();
  return deleted !== undefined;
}
