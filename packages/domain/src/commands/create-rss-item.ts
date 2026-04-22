import {rssItem} from 'database';
import {getDb} from '../db';
import type {CreateRssItemInput, RssItem} from '../types';

export async function createRssItem(input: CreateRssItemInput): Promise<RssItem | null> {
  const db = getDb();

  const [created] = await db
    .insert(rssItem)
    .values({
      feedId: input.feedId,
      guid: input.guid,
      title: input.title,
      link: input.link,
      summary: input.summary,
      content: input.content,
      imageUrl: input.imageUrl,
      publishedAt: input.publishedAt ? new Date(input.publishedAt) : undefined,
    })
    .onConflictDoNothing()
    .returning();

  return created || null;
}
