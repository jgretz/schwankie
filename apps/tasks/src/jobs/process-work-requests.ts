import type PgBoss from 'pg-boss';

import {
  listPendingWorkRequests,
  startWorkRequest,
  completeWorkRequest,
  failWorkRequest,
  fetchAllFeeds,
} from 'client';

export function createProcessWorkRequestsHandler(boss: PgBoss): PgBoss.WorkHandler<unknown> {
  return async () => {
    const pending = await listPendingWorkRequests();

    for (const wr of pending) {
      try {
        const claimed = await startWorkRequest(wr.id);
        if (!claimed) {
          console.log(`[process-work-requests] ${wr.id}: already claimed, skipping`);
          continue;
        }

        if (wr.type === 'refresh-all-feeds') {
          const feeds = await fetchAllFeeds();
          const jobs = feeds.map((feed) => ({
            name: 'import-feed',
            data: {feedId: feed.id, sourceUrl: feed.sourceUrl},
          }));
          if (jobs.length > 0) {
            await boss.insert(jobs);
          }
          console.log(
            `[process-work-requests] ${wr.id}: dispatched ${feeds.length} import-feed jobs`,
          );
        } else if (wr.type === 'refresh-emails') {
          await boss.send('import-emails', {});
          console.log(`[process-work-requests] ${wr.id}: dispatched import-emails`);
        }

        await completeWorkRequest(wr.id);
        console.log(`[process-work-requests] ${wr.id}: completed`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[process-work-requests] ${wr.id}: failed with error`, error);
        try {
          await failWorkRequest(wr.id, message);
        } catch (failError) {
          console.error(`[process-work-requests] ${wr.id}: failed to mark as failed`, failError);
        }
      }
    }
  };
}
