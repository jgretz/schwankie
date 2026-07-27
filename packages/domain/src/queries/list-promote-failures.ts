import {and, count, desc, eq} from 'drizzle-orm';
import {promoteFailure} from 'database';
import {getDb} from '../db';
import type {ListPromoteFailuresParams, ListPromoteFailuresResult} from '../types';

export async function listPromoteFailures(
  params: ListPromoteFailuresParams,
): Promise<ListPromoteFailuresResult> {
  const db = getDb();
  const {limit, offset, source} = params;

  const conditions = [];

  if (source) {
    conditions.push(eq(promoteFailure.source, source));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [items, totalResult] = await Promise.all([
    db
      .select()
      .from(promoteFailure)
      .where(where)
      .orderBy(desc(promoteFailure.createdAt))
      .limit(limit)
      .offset(offset),
    db.select({count: count()}).from(promoteFailure).where(where),
  ]);

  const total = totalResult[0]?.count ?? 0;

  return {
    items,
    total,
    hasMore: offset + limit < total,
    nextOffset: Math.min(offset + limit, total),
  };
}
