import {dailySummary, emailItem, feed, rssItem} from 'database';
import {and, eq, gte, inArray, lt} from 'drizzle-orm';
import {getDb} from '../db';
import type {MarkDailySummaryItemsReadResult} from '../types';

/**
 * Bounds and feed exclusion must stay in step with listDigestSourceItems.
 * filterDigestItems is deliberately not re-run: filler the digest passed over
 * should not linger unread behind it.
 *
 * getDailySummary is avoided because it falls through to the latest digest on an
 * empty date, which would mark the wrong window.
 */
export async function markDailySummaryItemsRead(
  summaryDate: string,
): Promise<MarkDailySummaryItemsReadResult | null> {
  const db = getDb();

  return db.transaction(async (tx) => {
    const [summary] = await tx
      .select({windowStart: dailySummary.windowStart, windowEnd: dailySummary.windowEnd})
      .from(dailySummary)
      .where(eq(dailySummary.summaryDate, summaryDate))
      .limit(1);

    if (!summary) return null;

    const {windowStart, windowEnd} = summary;

    const rssUpdated = await tx
      .update(rssItem)
      .set({read: true})
      .where(
        and(
          eq(rssItem.read, false),
          gte(rssItem.createdAt, windowStart),
          lt(rssItem.createdAt, windowEnd),
          inArray(
            rssItem.feedId,
            tx.select({id: feed.id}).from(feed).where(eq(feed.disabled, false)),
          ),
        ),
      )
      .returning({id: rssItem.id});

    const emailUpdated = await tx
      .update(emailItem)
      .set({read: true})
      .where(
        and(
          eq(emailItem.read, false),
          gte(emailItem.importedAt, windowStart),
          lt(emailItem.importedAt, windowEnd),
        ),
      )
      .returning({id: emailItem.id});

    const rssCount = rssUpdated.length;
    const emailCount = emailUpdated.length;

    return {rssCount, emailCount, count: rssCount + emailCount};
  });
}
