import type PgBoss from 'pg-boss';

import {cleanupWorkRequests} from 'client';

export const cleanupWorkRequestsHandler: PgBoss.WorkHandler<unknown> = async () => {
  const {count} = await cleanupWorkRequests();
  console.log(`[cleanup-work-requests] deleted ${count} old work requests`);
};
