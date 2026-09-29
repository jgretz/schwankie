import type PgBoss from 'pg-boss';

import {
  listPendingWorkRequests,
  startWorkRequest,
  completeWorkRequest,
  failWorkRequest,
  fetchAllFeeds,
  type PendingWorkMode,
} from 'client';

export interface WorkRequestsApi {
  listPendingWorkRequests: typeof listPendingWorkRequests;
  startWorkRequest: typeof startWorkRequest;
  completeWorkRequest: typeof completeWorkRequest;
  failWorkRequest: typeof failWorkRequest;
  fetchAllFeeds: typeof fetchAllFeeds;
}

const defaultApi: WorkRequestsApi = {
  listPendingWorkRequests,
  startWorkRequest,
  completeWorkRequest,
  failWorkRequest,
  fetchAllFeeds,
};

export function createProcessWorkRequestsHandler(
  boss: PgBoss,
  mode: PendingWorkMode,
  api: WorkRequestsApi = defaultApi,
): PgBoss.WorkHandler<unknown> {
  return async () => {
    const pending = await api.listPendingWorkRequests({mode});

    for (const wr of pending) {
      try {
        const claimed = await api.startWorkRequest(wr.id);
        if (!claimed) {
          console.log(`[process-work-requests] ${wr.id}: already claimed, skipping`);
          continue;
        }

        if (wr.type === 'refresh-all-feeds') {
          const feeds = await api.fetchAllFeeds();
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
          await boss.send('schedule-import-emails', {});
          console.log(`[process-work-requests] ${wr.id}: dispatched schedule-import-emails`);
        } else {
          throw new Error(`Unknown work request type: ${wr.type}`);
        }

        await api.completeWorkRequest(wr.id);
        console.log(`[process-work-requests] ${wr.id}: completed`);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[process-work-requests] ${wr.id}: failed with error`, error);
        try {
          await api.failWorkRequest(wr.id, message);
        } catch (failError) {
          console.error(`[process-work-requests] ${wr.id}: failed to mark as failed`, failError);
        }
      }
    }
  };
}
