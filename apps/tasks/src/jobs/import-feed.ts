import type PgBoss from 'pg-boss';
import {bulkUpsertRssItems, updateFeed, getFeed} from 'client';
import {parseFeed, getErrorMessage} from '../utils/rss-parser';

interface ImportFeedData {
  feedId: string;
  sourceUrl: string;
}

function toIso(dateString: string): string | undefined {
  const d = new Date(dateString);
  return Number.isNaN(d.getTime()) ? undefined : d.toISOString();
}

export const importFeedHandler: PgBoss.WorkHandler<ImportFeedData> = async (jobs) => {
  const job = jobs[0];
  if (!job) return;

  const {feedId, sourceUrl} = job.data;

  try {
    const items = await parseFeed(sourceUrl);

    if (items.length > 0) {
      await bulkUpsertRssItems(feedId, {
        items: items.map((item) => ({
          guid: item.guid,
          title: item.title,
          link: item.link,
          summary: item.summary || undefined,
          content: item.content || undefined,
          imageUrl: item.imageUrl || undefined,
          pubDate: item.pubDate ? toIso(item.pubDate) : undefined,
        })),
      });
    }

    await updateFeed(feedId, {errorCount: 0, lastError: null});
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    console.error(`[import-feed] ${feedId} (${sourceUrl}) failed:`, errorMessage);
    const currentFeed = await getFeed(feedId).catch(() => null);
    const errorCount = (currentFeed?.errorCount || 0) + 1;
    await updateFeed(feedId, {
      errorCount,
      lastError: errorMessage,
    }).catch((updateError) => {
      console.error(`[import-feed] ${feedId}: failed to record error`, updateError);
    });
    throw error;
  }
};
