import type PgBoss from 'pg-boss';
import {bulkUpsertRssItems, updateFeed, getFeed} from '@domain';
import {parseFeed, classifyError} from '../utils/rss-parser';

interface ImportFeedData {
  feedId: string;
  sourceUrl: string;
}

export const importFeedHandler: PgBoss.WorkHandler<ImportFeedData> = async (job) => {
  const {feedId, sourceUrl} = (job as unknown as {data: ImportFeedData}).data;

  try {
    const items = await parseFeed(sourceUrl);

    if (items.length > 0) {
      const mappedItems = items.map((item) => ({
        feedId,
        guid: item.guid,
        title: item.title,
        link: item.link,
        summary: item.summary || undefined,
        content: item.content || undefined,
        imageUrl: item.imageUrl || undefined,
        publishedAt: item.pubDate,
      }));

      await bulkUpsertRssItems(mappedItems);
    }

    await updateFeed(feedId, {errorCount: 0, lastError: null});
  } catch (error) {
    const errorMessage = classifyError(error);
    const currentFeed = await getFeed(feedId);
    const errorCount = (currentFeed?.errorCount || 0) + 1;
    await updateFeed(feedId, {
      errorCount,
      lastError: errorMessage,
    });
    throw error;
  }
};
