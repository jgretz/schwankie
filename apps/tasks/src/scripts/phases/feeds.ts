import postgres from 'postgres';
import {createFeed} from 'client';

export interface PhaseResult {
  read: number;
  wrote: number;
  skipped: number;
  errors: Error[];
}

interface StashlFeed {
  id: number;
  feed_url: string;
  title: string;
}

export async function migrateFeeds(
  sql: postgres.Sql,
  userId: number,
  dryRun: boolean,
): Promise<{result: PhaseResult; feedMap: Map<number, string>}> {
  const result: PhaseResult = {read: 0, wrote: 0, skipped: 0, errors: []};
  const feedMap = new Map<number, string>();

  try {
    const feeds = await sql<StashlFeed[]>`
      SELECT id, feed_url, title
      FROM rss_feeds
      WHERE user_id = ${userId}
    `;

    result.read = feeds.length;

    if (dryRun) {
      result.skipped = feeds.length;
      return {result, feedMap};
    }

    for (const feed of feeds) {
      try {
        const created = await createFeed({
          name: feed.title,
          sourceUrl: feed.feed_url,
        });

        feedMap.set(feed.id, created.id);
        result.wrote++;
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : String(error);
        // Unique constraint violation on source_url = feed already exists; skip
        if (errorMsg.includes('unique') || errorMsg.includes('Unique constraint')) {
          result.skipped++;
        } else {
          result.errors.push(error instanceof Error ? error : new Error(String(error)));
        }
      }
    }
  } catch (error) {
    result.errors.push(error instanceof Error ? error : new Error(String(error)));
  }

  return {result, feedMap};
}
