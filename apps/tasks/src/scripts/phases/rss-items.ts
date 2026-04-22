import postgres from 'postgres';
import {bulkUpsertRssItems} from 'client';

export interface PhaseResult {
  read: number;
  wrote: number;
  skipped: number;
  errors: Error[];
}

interface StashlRssItem {
  id: number;
  feed_id: number;
  guid: string;
  title: string;
  link: string;
  summary: string | null;
  content: string | null;
  image_url: string | null;
  pub_date: string | null;
}

const BATCH_SIZE = 200;

export async function migrateRssItems(
  sql: postgres.Sql,
  feedMap: Map<number, string>,
  dryRun: boolean,
): Promise<PhaseResult> {
  const result: PhaseResult = {read: 0, wrote: 0, skipped: 0, errors: []};

  try {
    for (const [stashlFeedId, schwankieFeedId] of feedMap.entries()) {
      try {
        const countResult = await sql<Array<{count: string | number}>>`
          SELECT COUNT(*)::int as count FROM rss_feed_items WHERE feed_id = ${stashlFeedId}
        `;
        const feedItemCount = parseInt(String(countResult[0]?.count ?? '0'), 10);
        result.read += feedItemCount;

        if (dryRun) {
          result.skipped += feedItemCount;
          continue;
        }

        let offset = 0;
        while (true) {
          const items = await sql<StashlRssItem[]>`
            SELECT
              id,
              feed_id,
              guid,
              title,
              link,
              summary,
              content,
              image_url,
              pub_date
            FROM rss_feed_items
            WHERE feed_id = ${stashlFeedId}
            ORDER BY pub_date DESC NULLS LAST, id DESC
            LIMIT ${BATCH_SIZE}
            OFFSET ${offset}
          `;

          if (items.length === 0) break;

          try {
            const {inserted} = await bulkUpsertRssItems(schwankieFeedId, {
              items: items.map((item) => ({
                guid: item.guid,
                title: item.title,
                link: item.link,
                summary: item.summary || undefined,
                content: item.content || undefined,
                imageUrl: item.image_url || undefined,
                pubDate: item.pub_date || undefined,
              })),
            });
            result.wrote += inserted;
            result.skipped += items.length - inserted;
          } catch (error) {
            result.errors.push(error instanceof Error ? error : new Error(String(error)));
          }

          offset += BATCH_SIZE;
        }
      } catch (error) {
        result.errors.push(error instanceof Error ? error : new Error(String(error)));
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  return result;
}
