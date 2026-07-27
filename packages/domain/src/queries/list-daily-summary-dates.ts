import {dailySummary} from 'database';
import {desc} from 'drizzle-orm';
import {getDb} from '../db';

/** Every date that has a digest, newest first — the page's prev/next spine. */
export async function listDailySummaryDates(): Promise<string[]> {
  const db = getDb();

  const rows = await db
    .select({summaryDate: dailySummary.summaryDate})
    .from(dailySummary)
    .orderBy(desc(dailySummary.summaryDate));

  return rows.map((row) => row.summaryDate);
}
