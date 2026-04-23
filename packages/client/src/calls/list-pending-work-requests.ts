import {apiFetch} from '../config';
import type {WorkRequestData} from '../types';

export function listPendingWorkRequests(): Promise<WorkRequestData[]> {
  return apiFetch<WorkRequestData[]>('/api/work/pending', {
    method: 'GET',
  });
}
