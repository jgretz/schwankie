import {feed, rssItem} from 'database';
import {and, count, desc, eq, sql} from 'drizzle-orm';
import {getDb} from '../db';
import type {ListAllRssItemsParams, ListAllRssItemsResult} from '../types';

export async function listAllRssItems(
  params: ListAllRssItemsParams,
): Promise<ListAllRssItemsResult> {
  const db = getDb();
  const {limit = 50, offset = 0, read, feedId} = params;

  const conditions = [eq(feed.disabled, false)];
  if (read !== undefined) conditions.push(eq(rssItem.read, read));
  if (feedId) conditions.push(eq(rssItem.feedId, feedId));

  const where = and(...conditions);

  const [items, totalResult] = await Promise.all([
    db
      .select({
        id: rssItem.id,
        feedId: rssItem.feedId,
        feedName: feed.name,
        guid: rssItem.guid,
        title: rssItem.title,
        link: rssItem.link,
        summary: rssItem.summary,
        content: rssItem.content,
        imageUrl: rssItem.imageUrl,
        publishedAt: rssItem.publishedAt,
        read: rssItem.read,
        clicked: rssItem.clicked,
        createdAt: rssItem.createdAt,
      })
      .from(rssItem)
      .innerJoin(feed, eq(rssItem.feedId, feed.id))
      .where(where)
      .orderBy(sql`${rssItem.publishedAt} DESC NULLS LAST`, desc(rssItem.createdAt))
      .limit(limit)
      .offset(offset),
    db
      .select({count: count()})
      .from(rssItem)
      .innerJoin(feed, eq(rssItem.feedId, feed.id))
      .where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    items,
    hasMore: offset + limit < total,
    nextOffset: Math.min(offset + limit, total),
    total,
  };
}
