import type PgBoss from 'pg-boss';
import {fetchAllFeeds} from 'client';

const BATCH_SIZE = 50;

export const scheduleFeedImportsHandler: PgBoss.WorkHandler<unknown> = async (boss) => {
  try {
    const feeds = await fetchAllFeeds();

    const jobs = feeds
      .filter((feed) => !feed.disabled)
      .map((feed) => ({
        name: 'import-feed',
        data: {feedId: feed.id, sourceUrl: feed.sourceUrl},
      }));

    for (let i = 0; i < jobs.length; i += BATCH_SIZE) {
      const batch = jobs.slice(i, i + BATCH_SIZE);
      const pgBoss = (boss as unknown as {boss: PgBoss}).boss || boss;
      await pgBoss.insert(batch);
    }
  } catch (error) {
    console.error('[schedule-feed-imports] Failed:', error);
    throw error;
  }
};
