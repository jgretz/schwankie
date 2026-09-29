import {apiFetch} from '../config';
import type {PendingWorkMode, WorkRequestData} from '../types';

export function listPendingWorkRequests(opts?: {
  mode?: PendingWorkMode;
}): Promise<WorkRequestData[]> {
  const query = opts?.mode ? `?mode=${opts.mode}` : '';
  return apiFetch<WorkRequestData[]>(`/api/work/pending${query}`, {
    method: 'GET',
  });
}
