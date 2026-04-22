import {feed} from 'database';
import {getDb} from '../db';
import type {CreateFeedInput, Feed} from '../types';

export async function createFeed(input: CreateFeedInput): Promise<Feed> {
  const db = getDb();

  const [created] = await db
    .insert(feed)
    .values({
      name: input.name,
      sourceUrl: input.sourceUrl,
    })
    .returning();

  return created!;
}
