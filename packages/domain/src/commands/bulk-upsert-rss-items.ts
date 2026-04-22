import {rssItem} from 'database';
import {getDb} from '../db';
import type {CreateRssItemInput} from '../types';

export async function bulkUpsertRssItems(items: CreateRssItemInput[]): Promise<number> {
  if (items.length === 0) return 0;

  const db = getDb();

  const inserted = await db
    .insert(rssItem)
    .values(
      items.map((item) => ({
        feedId: item.feedId,
        guid: item.guid,
        title: item.title,
        link: item.link,
        summary: item.summary,
        content: item.content,
        imageUrl: item.imageUrl,
        publishedAt: item.publishedAt ? new Date(item.publishedAt) : undefined,
      })),
    )
    .onConflictDoNothing()
    .returning();

  return inserted.length;
}
