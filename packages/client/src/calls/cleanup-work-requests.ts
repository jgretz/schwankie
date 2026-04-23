import {apiFetch} from '../config';

export function cleanupWorkRequests(): Promise<{count: number}> {
  return apiFetch<{count: number}>('/api/work/cleanup', {method: 'POST'});
}
