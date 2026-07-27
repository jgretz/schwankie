import {dailySummary} from 'database';
import {desc, eq} from 'drizzle-orm';
import {getDb} from '../db';
import type {DailySummary} from '../types';

/**
 * One digest. Without a date this returns the most recent one, which is what
 * the page shows by default.
 */
export async function getDailySummary(summaryDate?: string): Promise<DailySummary | null> {
  const db = getDb();

  const rows = summaryDate
    ? await db.select().from(dailySummary).where(eq(dailySummary.summaryDate, summaryDate)).limit(1)
    : await db.select().from(dailySummary).orderBy(desc(dailySummary.summaryDate)).limit(1);

  return rows[0] ?? null;
}
