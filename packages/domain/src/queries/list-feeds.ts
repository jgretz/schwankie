import {feed} from 'database';
import {desc} from 'drizzle-orm';
import {getDb} from '../db';

export async function listFeeds() {
  const db = getDb();

  const feeds = await db.select().from(feed).orderBy(desc(feed.createdAt));

  return feeds;
}
