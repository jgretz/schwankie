import {and, count, desc, eq} from 'drizzle-orm';
import {emailItem} from 'database';
import {getDb} from '../db';
import type {ListEmailItemsParams, ListEmailItemsResult} from '../types';

export async function listEmailItems(params: ListEmailItemsParams): Promise<ListEmailItemsResult> {
  const db = getDb();
  const {limit, offset, read, from} = params;

  const conditions = [];

  if (read !== undefined) {
    conditions.push(eq(emailItem.read, read));
  }

  if (from) {
    conditions.push(eq(emailItem.emailFrom, from));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(emailItem)
      .where(where)
      .orderBy(desc(emailItem.importedAt))
      .limit(limit)
      .offset(offset),
    db.select({count: count()}).from(emailItem).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    items,
    total,
    hasMore: offset + limit < total,
    nextOffset: Math.min(offset + limit, total),
  };
}
