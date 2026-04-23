import {count, gte} from 'drizzle-orm';
import {emailItem} from 'database';
import {getDb} from '../db';

export async function countRecentEmailItems(days: number = 7): Promise<number> {
  const db = getDb();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - days);

  const result = await db
    .select({count: count()})
    .from(emailItem)
    .where(gte(emailItem.importedAt, sevenDaysAgo));

  return result[0]?.count ?? 0;
}
