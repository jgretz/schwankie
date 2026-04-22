import {rssItem} from 'database';
import {and, count, desc, eq, ilike, or, sql} from 'drizzle-orm';
import {getDb} from '../db';
import type {ListRssItemsParams, ListRssItemsResult} from '../types';

export async function listRssItems(params: ListRssItemsParams): Promise<ListRssItemsResult> {
  const db = getDb();
  const {feedId, limit = 20, offset = 0, read, clicked, q} = params;

  const conditions: Parameters<typeof and> = [eq(rssItem.feedId, feedId)];

  if (read !== undefined) {
    conditions.push(eq(rssItem.read, read));
  }

  if (clicked !== undefined) {
    conditions.push(eq(rssItem.clicked, clicked));
  }

  if (q) {
    conditions.push(or(ilike(rssItem.title, `%${q}%`), ilike(rssItem.summary, `%${q}%`)));
  }

  const where = and(...conditions);

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(rssItem)
      .where(where)
      .orderBy(
        sql`${rssItem.publishedAt} DESC NULLS LAST`,
        desc(rssItem.createdAt),
      )
      .limit(limit)
      .offset(offset),
    db.select({count: count()}).from(rssItem).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    items,
    hasMore: offset + limit < total,
    nextOffset: Math.min(offset + limit, total),
    total,
  };
}
