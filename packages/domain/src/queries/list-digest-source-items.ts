import {emailItem, feed, rssItem} from 'database';
import {and, desc, eq, gte, lt} from 'drizzle-orm';
import {getDb} from '../db';
import {digestWindow} from '../lib/digest-date';
import {filterDigestItems} from '../lib/digest-filters';
import type {
  DigestSourceItem,
  ListDigestSourceItemsParams,
  ListDigestSourceItemsResult,
} from '../types';

/**
 * The noise-filtered link window a digest is clustered from.
 *
 * Both sides filter on INGESTION time, not publication time: rss_item's
 * published_at is nullable and carries known bad rows, and email_item has no
 * published column at all. "What arrived in the last N hours" is also the
 * question a morning digest is actually asking.
 *
 * Disabled feeds are excluded, matching listAllRssItems.
 */
export async function listDigestSourceItems(
  params: ListDigestSourceItemsParams,
): Promise<ListDigestSourceItemsResult> {
  const db = getDb();
  const {hours, now = new Date()} = params;
  const {windowStart, windowEnd} = digestWindow(now, hours);

  const [rssRows, emailRows] = await Promise.all([
    db
      .select({
        url: rssItem.link,
        title: rssItem.title,
        source: feed.name,
        ingestedAt: rssItem.createdAt,
      })
      .from(rssItem)
      .innerJoin(feed, eq(rssItem.feedId, feed.id))
      .where(
        and(
          eq(feed.disabled, false),
          gte(rssItem.createdAt, windowStart),
          lt(rssItem.createdAt, windowEnd),
        ),
      )
      .orderBy(desc(rssItem.createdAt)),
    db
      .select({
        url: emailItem.link,
        title: emailItem.title,
        source: emailItem.emailFrom,
        ingestedAt: emailItem.importedAt,
      })
      .from(emailItem)
      .where(and(gte(emailItem.importedAt, windowStart), lt(emailItem.importedAt, windowEnd)))
      .orderBy(desc(emailItem.importedAt)),
  ]);

  const combined: DigestSourceItem[] = [
    ...rssRows.map((row) => ({
      url: row.url,
      title: row.title,
      source: row.source,
      sourceKind: 'rss' as const,
      ingestedAt: row.ingestedAt,
    })),
    ...emailRows.map((row) => ({
      url: row.url,
      // email_item.title is nullable; fall back to the url so clustering still
      // has something to read, and so the filters see a stable string.
      title: row.title ?? row.url,
      source: row.source,
      sourceKind: 'email' as const,
      ingestedAt: row.ingestedAt,
    })),
  ].sort((a, b) => b.ingestedAt.getTime() - a.ingestedAt.getTime());

  const items = filterDigestItems(combined);

  return {
    items,
    windowStart: windowStart.toISOString(),
    windowEnd: windowEnd.toISOString(),
    count: items.length,
  };
}
