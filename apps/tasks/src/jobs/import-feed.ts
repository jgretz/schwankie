import type PgBoss from 'pg-boss';
import {bulkUpsertRssItems, updateFeed, getFeed} from 'client';
import {parseFeed, getErrorMessage} from '../utils/rss-parser';

interface ImportFeedData {
  feedId: string;
  sourceUrl: string;
}

export const importFeedHandler: PgBoss.WorkHandler<ImportFeedData> = async (jobs) => {
  for (const job of jobs) {
    await processJob(job);
  }
};

async function processJob(job: PgBoss.Job<ImportFeedData>): Promise<void> {
  const {feedId, sourceUrl} = job.data;

  try {
    const items = await parseFeed(sourceUrl);
    console.log(`[import-feed] ${sourceUrl}: parsed ${items.length} items`);

    if (items.length > 0) {
      const {inserted} = await bulkUpsertRssItems(feedId, {
        items: items.map((item) => ({
          guid: item.guid,
          title: item.title,
          link: item.link,
          summary: item.summary || undefined,
          content: item.content || undefined,
          imageUrl: item.imageUrl || undefined,
          pubDate: item.pubDate,
        })),
      });
      console.log(`[import-feed] ${sourceUrl}: inserted ${inserted} new items`);
    }

    await updateFeed(feedId, {errorCount: 0, lastError: null});
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`[import-feed] ${sourceUrl} failed: ${errorMessage}`);
    const currentFeed = await getFeed(feedId).catch(() => null);
    const errorCount = (currentFeed?.errorCount || 0) + 1;
    await updateFeed(feedId, {
      errorCount,
      lastError: errorMessage,
    }).catch((updateError) => {
      console.error(`[import-feed] ${feedId}: failed to record error`, updateError);
    });
    // Don't rethrow — the error is recorded on the feed. Rethrowing makes
    // pg-boss retry feeds that are permanently broken (bad cert, 404) and
    // spam the queue.
  }
}
