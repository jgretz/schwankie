import {apiFetch} from '../config';

export async function cleanupStaleRunners(): Promise<{deleted: number}> {
  return apiFetch<{deleted: number}>('/api/runners/cleanup', {
    method: 'POST',
  });
}
