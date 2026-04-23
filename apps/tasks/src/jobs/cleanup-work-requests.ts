import type PgBoss from 'pg-boss';

import {cleanupOldWorkRequests} from '@domain';

export const cleanupWorkRequestsHandler: PgBoss.WorkHandler<unknown> = async () => {
  const count = await cleanupOldWorkRequests();
  console.log(`[cleanup-work-requests] deleted ${count} old work requests`);
};
