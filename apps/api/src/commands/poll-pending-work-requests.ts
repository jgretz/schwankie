import {markWorkRequestPending, takeWorkRequestPending} from '../lib/work-request-signal';

export type PendingWorkMode = 'hinted' | 'full';

export async function pollPendingWorkRequests<T>(
  mode: PendingWorkMode,
  list: () => Promise<T[]>,
): Promise<T[]> {
  const hinted = takeWorkRequestPending();
  if (mode === 'hinted' && !hinted) return [];

  try {
    return await list();
  } catch (error) {
    markWorkRequestPending();
    throw error;
  }
}
