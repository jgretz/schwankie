import {dailySummary} from 'database';
import {getDb} from '../db';
import type {DailySummary, UpsertDailySummaryInput} from '../types';

/**
 * Write the digest for a date, overwriting any existing row. Re-running the
 * generator for the same day is a correction, not a duplicate.
 */
export async function upsertDailySummary(
  input: UpsertDailySummaryInput,
): Promise<DailySummary | null> {
  const db = getDb();
  const now = new Date();

  const values = {
    summaryDate: input.summaryDate,
    lookbackHours: input.lookbackHours,
    windowStart: input.windowStart,
    windowEnd: input.windowEnd,
    itemCount: input.itemCount,
    coveredCount: input.coveredCount,
    notable: input.notable ?? null,
    topics: input.topics,
    updatedAt: now,
  };

  const rows = await db
    .insert(dailySummary)
    .values(values)
    .onConflictDoUpdate({
      target: dailySummary.summaryDate,
      set: values,
    })
    .returning();

  return rows[0] ?? null;
}
